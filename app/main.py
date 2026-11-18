"""Saans — FastAPI application entry point.

Serves the API endpoints and the same-origin frontend.
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from app.cities import get_city, list_cities
from app.config import settings
from app.planner import generate_plan
from app.providers import ProviderError, get_provider
from app.rules import load_sources
from app.schemas import (
    AirQualityRequest,
    CompareRequest,
    CompareResponse,
    HealthStatus,
    HouseholdProfile,
    PlanRequest,
    PlanResponse,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(name)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("Saans starting — data_mode=%s, gemini_available=%s",
                settings.data_mode, settings.gemini_available)
    if not settings.gemini_available:
        logger.warning("GEMINI_API_KEY not configured. AI planning will use fallback mode.")
    yield
    logger.info("Saans shutting down")


app = FastAPI(
    title="Saans",
    description="Your family's cleaner-air day — urban air quality assistant",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Track in-flight requests to prevent duplicate expensive calls
_plan_in_flight: dict[str, bool] = {}


# --- Health check ---

@app.get("/health")
async def health() -> HealthStatus:
    """Readiness check without secrets or personal context."""
    return HealthStatus(
        status="ok",
        data_mode=settings.data_mode,
        gemini_available=settings.gemini_available,
        version="0.1.0",
    )


# --- City endpoints ---

@app.get("/api/cities")
async def get_cities():
    """List supported cities."""
    return list_cities()


# --- Air quality endpoint ---

@app.get("/api/air")
async def get_air_quality(city: str):
    """Fetch current air quality for a city."""
    city_info = get_city(city)
    if not city_info:
        raise HTTPException(status_code=400, detail=f"Unsupported city: {city}")

    provider = get_provider(
        mode=settings.data_mode,
        timeout=settings.open_meteo_timeout_seconds,
    )

    try:
        context = await provider.fetch(
            latitude=city_info["latitude"],
            longitude=city_info["longitude"],
            label=city_info["label"],
        )
        return context.model_dump(mode="json")
    except ProviderError as e:
        logger.error("Provider error for %s: %s", city, e)
        return JSONResponse(
            status_code=503,
            content={
                "error": str(e),
                "city": city,
                "provider_status": "unavailable",
                "suggestion": "Environmental data is temporarily unavailable. The plan will use general guidance.",
            },
        )


# --- Plan generation endpoint ---

@app.post("/api/plan")
async def create_plan(request: PlanRequest) -> PlanResponse:
    """Generate a daily plan for a household."""
    profile = request.profile

    # Prevent duplicate in-flight requests
    request_key = f"{profile.city}:{hash(str(profile.model_dump()))}"
    if _plan_in_flight.get(request_key):
        raise HTTPException(
            status_code=429,
            detail="A plan request is already being generated. Please wait.",
        )

    _plan_in_flight[request_key] = True
    try:
        # Fetch environmental data
        city_info = get_city(profile.city)
        if not city_info:
            raise HTTPException(status_code=400, detail=f"Unsupported city: {profile.city}")

        provider = get_provider(
            mode=settings.data_mode,
            timeout=settings.open_meteo_timeout_seconds,
        )

        try:
            context = await provider.fetch(
                latitude=city_info["latitude"],
                longitude=city_info["longitude"],
                label=city_info["label"],
            )
        except ProviderError as e:
            logger.error("Provider error during plan: %s", e)
            # Create a minimal context for fallback
            from datetime import datetime, timezone as tz
            from app.schemas import DataSourceKind, EnvironmentalContext
            context = EnvironmentalContext(
                provider="Unavailable",
                source_url="",
                source_kind=DataSourceKind.MODEL,
                location_label=city_info["label"],
                latitude=city_info["latitude"],
                longitude=city_info["longitude"],
                retrieved_at=datetime.now(tz.utc),
                quality_flags=["provider_unavailable"],
                is_stale=True,
                attribution="Environmental data unavailable",
            )

        # Generate plan
        plan = await generate_plan(
            profile=profile,
            context=context,
            constraint_changes=request.constraint_changes,
        )

        # Validate fingerprint against stale responses
        if request.previous_plan_fingerprint and plan.input_fingerprint == request.previous_plan_fingerprint:
            plan.warnings.append("Plan context unchanged from previous request.")

        return plan

    finally:
        _plan_in_flight.pop(request_key, None)


# --- Compare/replan endpoint ---

@app.post("/api/compare")
async def compare_plans(request: CompareRequest) -> CompareResponse:
    """Compare baseline and revised plans after constraint changes."""
    profile = request.profile

    # Generate original plan (or use provided baseline)
    city_info = get_city(profile.city)
    if not city_info:
        raise HTTPException(status_code=400, detail=f"Unsupported city: {profile.city}")

    provider = get_provider(mode=settings.data_mode, timeout=settings.open_meteo_timeout_seconds)
    try:
        context = await provider.fetch(
            latitude=city_info["latitude"],
            longitude=city_info["longitude"],
            label=city_info["label"],
        )
    except ProviderError:
        raise HTTPException(status_code=503, detail="Environmental data unavailable for comparison")

    # Generate original plan
    original_plan = await generate_plan(profile=profile, context=context)

    # Generate revised plan with changed constraints
    revised_plan = await generate_plan(
        profile=profile,
        context=context,
        constraint_changes=request.changed_constraints,
    )

    # Identify changes
    original_ids = {a.action_id for a in original_plan.actions}
    revised_ids = {a.action_id for a in revised_plan.actions}

    changes = []
    added = revised_ids - original_ids
    removed = original_ids - revised_ids
    if added:
        changes.append(f"Added actions: {', '.join(added)}")
    if removed:
        changes.append(f"Removed actions: {', '.join(removed)}")
    if not added and not removed:
        changes.append("Same actions selected, but recommendations may differ in timing or emphasis.")

    preserved = []
    for block in profile.routine_blocks:
        if block.is_fixed:
            preserved.append(f"{block.label} ({block.start_time}–{block.end_time})")

    return CompareResponse(
        original_plan=original_plan,
        revised_plan=revised_plan,
        changes_summary=changes,
        preserved_constraints=preserved,
        impact_notes=["Comparison is qualitative. Specific emission or exposure changes are not calculated in this version."],
    )


# --- Source lookup ---

@app.get("/api/sources/{source_id}")
async def get_source(source_id: str):
    """Look up a curated source by ID."""
    sources = load_sources()
    if source_id not in sources:
        raise HTTPException(status_code=404, detail=f"Source {source_id} not found")
    return sources[source_id].model_dump()


@app.get("/api/sources")
async def get_all_sources():
    """List all curated sources."""
    sources = load_sources()
    return [s.model_dump() for s in sources.values()]


# --- Static files and SPA ---

# Mount static files
if STATIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(STATIC_DIR)), name="static")


@app.get("/")
async def serve_index():
    """Serve the main application page."""
    index_path = STATIC_DIR / "index.html"
    if index_path.exists():
        return FileResponse(str(index_path))
    return JSONResponse(
        content={"message": "Saans API is running. Frontend not yet built.", "docs": "/docs"},
    )
