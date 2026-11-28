"""Single-process local Saans API with bounded planning and private snapshots."""

from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.cities import get_city, list_cities
from app.config import settings
from app.planner import generate_plan, profile_fingerprint
from app.planning_state import AirDataCache, PlanningLimiter, SnapshotStore
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
# Route docstrings are written for maintainers, not API clients. FastAPI cuts an operation
# description at a form feed, so passing only "\f" keeps them out of /openapi.json and leaves
# the published schema unchanged.
_END_OPENAPI_DESCRIPTION = "\f"
planning_limiter = PlanningLimiter()
snapshot_store = SnapshotStore()
air_data_cache = AirDataCache()


async def environment(city: str) -> EnvironmentalContext:
    """Fetch city air quality, reusing live data while its cache entry is fresh."""
    info = get_city(city)
    if not info:
        raise HTTPException(400, "Unsupported city")
    # Fixture runs stay independent of the live cache. Fetch failures are returned uncached.
    cacheable = settings.data_mode == "live"
    cached = air_data_cache.get(info["label"]) if cacheable else None
    if cached is not None:
        return cached
    try:
        context = await get_provider(settings.data_mode, settings.open_meteo_timeout_seconds).fetch(
            info["latitude"],
            info["longitude"],
            info["label"],
        )
        if cacheable:
            air_data_cache.remember(info["label"], context)
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
    """Apply supported comparison changes to a validated copy of the profile."""
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


@app.get("/health", description=_END_OPENAPI_DESCRIPTION)
async def health() -> HealthStatus:
    """Report the configured data mode and whether Gemini has a key."""
    return HealthStatus(data_mode=settings.data_mode, gemini_available=settings.gemini_available)


@app.get("/api/cities", description=_END_OPENAPI_DESCRIPTION)
async def cities() -> list[dict]:
    """List supported city keys, labels, coordinates and timezones."""
    return list_cities()


@app.get("/api/air", description=_END_OPENAPI_DESCRIPTION)
async def air(city: str) -> EnvironmentalContext:
    """Return the environmental record for a supported city."""
    return await environment(city)


@app.post("/api/plan", description=_END_OPENAPI_DESCRIPTION)
async def plan(request: PlanRequest) -> PlanResponse:
    """Create a plan and save its inputs as a comparison baseline."""
    if request.constraint_changes:
        raise HTTPException(422, "Use typed changes through /api/compare")
    return await _create_snapshot(request.profile)


async def _create_snapshot(profile: HouseholdProfile) -> PlanResponse:
    """Admit, generate and save plans through one path shared by both planning routes."""
    async with planning_limiter.slot(
        settings.max_concurrent_gemini_calls, settings.max_plan_requests_per_minute
    ):
        context = await environment(profile.city)
        return snapshot_store.remember(profile, await generate_plan(profile, context))


@app.post("/api/compare", description=_END_OPENAPI_DESCRIPTION)
async def compare(request: CompareRequest) -> CompareResponse:
    """Replan from a saved baseline and summarize differences in action order."""
    snapshot = snapshot_store.get(request.baseline_plan_id)
    if not snapshot:
        raise HTTPException(409, "The previous plan expired. Create a new plan first.")
    # The stored original is the baseline, even if the air provider now has newer data.
    original_profile, original = snapshot
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


@app.get("/api/sources", description=_END_OPENAPI_DESCRIPTION)
async def sources() -> list[SourceRecord]:
    """List the reviewed evidence records."""
    return list(load_sources().values())


@app.get("/api/sources/{source_id}", description=_END_OPENAPI_DESCRIPTION)
async def source(source_id: str) -> SourceRecord:
    """Look up one reviewed evidence record by its ID."""
    record = load_sources().get(source_id)
    if record is None:
        raise HTTPException(404, "Unknown source")
    return record


app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/", description=_END_OPENAPI_DESCRIPTION)
async def index() -> FileResponse:
    """Serve the browser application entry page."""
    return FileResponse(STATIC_DIR / "index.html")
