"""Single-process local Saans API with bounded planning and private snapshots."""

from __future__ import annotations

import time
import uuid
from collections import OrderedDict, deque
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.cities import get_city, list_cities
from app.config import settings
from app.planner import generate_plan, profile_fingerprint
from app.providers import ProviderError, get_provider
from app.rules import load_sources
from app.schemas import (
    CompareRequest,
    CompareResponse,
    ConstraintChange,
    DataSourceKind,
    EnvironmentalContext,
    HealthStatus,
    HouseholdProfile,
    PlanRequest,
    PlanResponse,
    SourceRecord,
)
from app.security import RequestGuards

app = FastAPI(title="Saans", version="0.1.0")
app.add_middleware(RequestGuards)
STATIC_DIR = Path(__file__).parent / "static"
# Process-local, bounded, expiring snapshots; opaque IDs act as temporary capabilities.
_snapshots: OrderedDict[str, tuple[float, HouseholdProfile, PlanResponse]] = OrderedDict()
_request_times: deque[float] = deque()
_active = 0


def remember(profile: HouseholdProfile, plan: PlanResponse) -> PlanResponse:
    prune_snapshots()
    plan.plan_id = uuid.uuid4().hex
    _snapshots[plan.plan_id] = (
        time.monotonic(),
        profile.model_copy(deep=True),
        plan.model_copy(deep=True),
    )
    while len(_snapshots) > 100:
        _snapshots.popitem(last=False)
    return plan


def prune_snapshots() -> None:
    for key, (created, _, _) in list(_snapshots.items()):
        if time.monotonic() - created > 1800:
            del _snapshots[key]


@asynccontextmanager
async def planning_slot() -> AsyncIterator[None]:
    global _active
    now = time.monotonic()
    while _request_times and now - _request_times[0] >= 60:
        _request_times.popleft()
    if (
        _active >= settings.max_concurrent_gemini_calls
        or len(_request_times) >= settings.max_plan_requests_per_minute
    ):
        raise HTTPException(429, "Planning is busy. Please try again shortly.")
    _request_times.append(now)
    _active += 1
    try:
        yield
    finally:
        _active -= 1


# CAMS model data updates hourly, so reuse a successful live fetch per city briefly
# instead of calling Open-Meteo again for every plan and comparison.
AIR_CACHE_SECONDS = 600
_air_cache: dict[str, tuple[float, EnvironmentalContext]] = {}


async def environment(city: str) -> EnvironmentalContext:
    info = get_city(city)
    if not info:
        raise HTTPException(400, "Unsupported city")
    cacheable = settings.data_mode == "live"
    cached = _air_cache.get(info["label"]) if cacheable else None
    if cached and time.monotonic() - cached[0] < AIR_CACHE_SECONDS:
        return cached[1].model_copy(deep=True)
    try:
        context = await get_provider(settings.data_mode, settings.open_meteo_timeout_seconds).fetch(
            info["latitude"],
            info["longitude"],
            info["label"],
        )
        if cacheable:
            _air_cache[info["label"]] = (time.monotonic(), context.model_copy(deep=True))
        return context
    except ProviderError:
        return EnvironmentalContext(
            provider="Unavailable",
            source_url="",
            source_kind=DataSourceKind.UNAVAILABLE,
            location_label=info["label"],
            latitude=info["latitude"],
            longitude=info["longitude"],
            retrieved_at=datetime.now(timezone.utc),
            is_stale=True,
            quality_flags=["provider_unavailable"],
            attribution="Environmental data unavailable",
        )


def apply_changes(profile: HouseholdProfile, changes: list[ConstraintChange]) -> HouseholdProfile:
    data = profile.model_dump(mode="json")
    for change in changes:
        if change in ("purifier_on", "purifier_off"):
            data["has_purifier"] = change == "purifier_on"
        elif change in ("budget_zero", "budget_low"):
            data["budget_band"] = change.removeprefix("budget_")
        elif change in ("transit_on", "transit_off"):
            transport = [t for t in data["available_transport"] if t != "public_transit"]
            if change == "transit_on":
                transport.append("public_transit")
            data["available_transport"] = transport
        elif change == "more_flexibility":
            data["flexibility_minutes"] = min(240, data["flexibility_minutes"] + 30)
        elif change != "keep_schedule":
            raise ValueError("Unsupported constraint change")
    return HouseholdProfile.model_validate(data)


@app.get("/health")
async def health() -> HealthStatus:
    return HealthStatus(data_mode=settings.data_mode, gemini_available=settings.gemini_available)


@app.get("/api/cities")
async def cities() -> list[dict]:
    return list_cities()


@app.get("/api/air")
async def air(city: str) -> EnvironmentalContext:
    return await environment(city)


@app.post("/api/plan")
async def plan(request: PlanRequest) -> PlanResponse:
    if request.constraint_changes:
        raise HTTPException(422, "Use typed changes through /api/compare")
    return await _create_snapshot(request.profile)


async def _create_snapshot(profile: HouseholdProfile) -> PlanResponse:
    async with planning_slot():
        context = await environment(profile.city)
        return remember(profile, await generate_plan(profile, context))


@app.post("/api/compare")
async def compare(request: CompareRequest) -> CompareResponse:
    prune_snapshots()
    snapshot = _snapshots.get(request.baseline_plan_id)
    if not snapshot:
        raise HTTPException(409, "The previous plan expired. Create a new plan first.")
    _, original_profile, original = snapshot
    if profile_fingerprint(request.profile) != profile_fingerprint(original_profile):
        raise HTTPException(409, "Profile changed. Create a new plan first.")
    revised_profile = apply_changes(original_profile, request.changed_constraints)
    revised = await _create_snapshot(revised_profile)
    before = {a.action_id: a.title for a in original.actions}
    after = {a.action_id: a.title for a in revised.actions}
    changes = [f"Added: {title}" for action_id, title in after.items() if action_id not in before]
    changes += [
        f"Removed: {title}" for action_id, title in before.items() if action_id not in after
    ]
    if not changes:
        changes = [
            "Your constraints were updated. The same actions remain eligible; "
            "no new benefit is claimed."
        ]
    return CompareResponse(
        original_plan=original,
        revised_plan=revised,
        revised_profile=revised_profile,
        changes_summary=changes,
        preserved_constraints=[
            f"{b.label} ({b.start_time}–{b.end_time})"
            for b in revised_profile.routine_blocks
            if b.is_fixed
        ],
        impact_notes=[
            "Qualitative comparison only. Current environmental context was refreshed; "
            "no numerical savings calculated."
        ],
    )


@app.get("/api/sources")
async def sources() -> list[SourceRecord]:
    return list(load_sources().values())


@app.get("/api/sources/{source_id}")
async def source(source_id: str) -> SourceRecord:
    record = load_sources().get(source_id)
    if record is None:
        raise HTTPException(404, "Unknown source")
    return record


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def index() -> FileResponse:
    return FileResponse(STATIC_DIR / "index.html")
