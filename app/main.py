"""Single-process local Saans API with bounded planning and private snapshots."""
from __future__ import annotations

import time
import uuid
from collections import OrderedDict, deque
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.cities import get_city, list_cities
from app.config import settings
from app.security import RequestGuards
from app.planner import generate_plan, profile_fingerprint
from app.providers import ProviderError, get_provider
from app.rules import load_sources
from app.schemas import (CompareRequest, CompareResponse, DataSourceKind,
                         EnvironmentalContext, HealthStatus, HouseholdProfile, PlanRequest)

app = FastAPI(title="Saans", version="0.1.0")
app.add_middleware(RequestGuards)
STATIC_DIR = Path(__file__).parent / "static"
# Process-local, bounded, expiring snapshots; opaque IDs act as temporary capabilities.
_snapshots = OrderedDict()
_request_times = deque()
_active = 0


def remember(profile, plan):
    prune_snapshots()
    plan.plan_id = uuid.uuid4().hex
    _snapshots[plan.plan_id] = (time.monotonic(), profile.model_copy(deep=True), plan.model_copy(deep=True))
    while len(_snapshots) > 100:
        _snapshots.popitem(last=False)
    return plan


def prune_snapshots():
    for key, (created, _, _) in list(_snapshots.items()):
        if time.monotonic() - created > 1800:
            del _snapshots[key]


@asynccontextmanager
async def planning_slot():
    global _active
    now = time.monotonic()
    while _request_times and now - _request_times[0] >= 60:
        _request_times.popleft()
    if (_active >= settings.max_concurrent_gemini_calls or
            len(_request_times) >= settings.max_plan_requests_per_minute):
        raise HTTPException(429, "Planning is busy. Please try again shortly.")
    _request_times.append(now)
    _active += 1
    try:
        yield
    finally:
        _active -= 1


async def environment(city):
    info = get_city(city)
    if not info:
        raise HTTPException(400, "Unsupported city")
    try:
        return await get_provider(settings.data_mode, settings.open_meteo_timeout_seconds).fetch(
            info["latitude"], info["longitude"], info["label"],
        )
    except ProviderError:
        return EnvironmentalContext(
            provider="Unavailable", source_url="", source_kind=DataSourceKind.UNAVAILABLE,
            location_label=info["label"], latitude=info["latitude"], longitude=info["longitude"],
            retrieved_at=datetime.now(timezone.utc), is_stale=True,
            quality_flags=["provider_unavailable"], attribution="Environmental data unavailable",
        )


def apply_changes(profile, changes):
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
async def health():
    return HealthStatus(data_mode=settings.data_mode, gemini_available=settings.gemini_available)


@app.get("/api/cities")
async def cities():
    return list_cities()


@app.get("/api/air")
async def air(city: str):
    return await environment(city)


@app.post("/api/plan")
async def plan(request: PlanRequest):
    if request.constraint_changes:
        raise HTTPException(422, "Use typed changes through /api/compare")
    async with planning_slot():
        context = await environment(request.profile.city)
        result = await generate_plan(request.profile, context)
        return remember(request.profile, result)


@app.post("/api/compare")
async def compare(request: CompareRequest):
    prune_snapshots()
    snapshot = _snapshots.get(request.baseline_plan_id)
    if not snapshot:
        raise HTTPException(409, "The previous plan expired. Create a new plan first.")
    _, original_profile, original = snapshot
    if profile_fingerprint(request.profile) != profile_fingerprint(original_profile):
        raise HTTPException(409, "Profile changed. Create a new plan first.")
    revised_profile = apply_changes(original_profile, request.changed_constraints)
    async with planning_slot():
        context = await environment(revised_profile.city)
        revised = remember(revised_profile, await generate_plan(revised_profile, context))
    before = {a.action_id: a.title for a in original.actions}
    after = {a.action_id: a.title for a in revised.actions}
    changes = [f"Added: {after[k]}" for k in after.keys() - before.keys()]
    changes += [f"Removed: {before[k]}" for k in before.keys() - after.keys()]
    if not changes:
        changes = ["Your constraints were updated. The same actions remain eligible; no new benefit is claimed."]
    return CompareResponse(
        original_plan=original, revised_plan=revised, revised_profile=revised_profile,
        changes_summary=changes,
        preserved_constraints=[f"{b.label} ({b.start_time}–{b.end_time})" for b in revised_profile.routine_blocks if b.is_fixed],
        impact_notes=["Qualitative comparison only. Current environmental context was refreshed; no numerical savings calculated."],
    )


@app.get("/api/sources")
async def sources():
    return list(load_sources().values())


@app.get("/api/sources/{source_id}")
async def source(source_id: str):
    record = load_sources().get(source_id)
    if record is None:
        raise HTTPException(404, "Unknown source")
    return record


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def index():
    return FileResponse(STATIC_DIR / "index.html")
