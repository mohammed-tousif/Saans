"""Exercise admission limits, snapshot eviction, cache expiry and breaker recovery."""

import asyncio
from http import HTTPStatus

import pytest
from fastapi import HTTPException

from app.planner import ModelCircuitBreaker
from app.planning_state import AirDataCache, PlanningLimiter, SnapshotStore
from app.providers import FixtureProvider
from app.schemas import HouseholdProfile, PlanResponse, RoutineBlock


class Clock:
    """Expose a manually advanced monotonic clock so expiry tests need no delays."""

    def __init__(self) -> None:
        """Start simulated time at zero."""
        self.now = 0.0

    def __call__(self) -> float:
        """Return the simulated time in seconds."""
        return self.now


@pytest.mark.parametrize("interruption", [RuntimeError, asyncio.CancelledError])
async def test_limiter_releases_slot_and_counts_only_admitted_work(interruption):
    """Check concurrency rejection and slot release on failure or cancellation."""
    limiter = PlanningLimiter(clock=Clock())

    with pytest.raises(interruption):
        async with limiter.slot(max_concurrent=1, max_per_minute=2):
            assert limiter.active_count == 1
            with pytest.raises(HTTPException) as rejected:
                async with limiter.slot(max_concurrent=1, max_per_minute=2):
                    pytest.fail("An overlapping request was admitted")
            assert rejected.value.status_code == HTTPStatus.TOO_MANY_REQUESTS
            assert rejected.value.detail == "Planning is busy. Please try again shortly."
            raise interruption()

    assert limiter.active_count == 0
    async with limiter.slot(max_concurrent=1, max_per_minute=2):
        assert limiter.active_count == 1
    with pytest.raises(HTTPException):
        async with limiter.slot(max_concurrent=1, max_per_minute=2):
            pytest.fail("Interrupted work should still count toward the rate limit")


async def test_limiter_expires_admission_at_one_minute():
    """Check that the rolling limit releases an admission at exactly 60 seconds."""
    clock = Clock()
    limiter = PlanningLimiter(clock=clock)

    async with limiter.slot(max_concurrent=1, max_per_minute=1):
        assert limiter.active_count == 1
    clock.now = 59.999
    with pytest.raises(HTTPException):
        async with limiter.slot(max_concurrent=1, max_per_minute=1):
            pytest.fail("The original admission is still inside the rate window")
    clock.now = 60.0
    async with limiter.slot(max_concurrent=1, max_per_minute=1):
        assert limiter.active_count == 1
    limiter.reset()
    async with limiter.slot(max_concurrent=1, max_per_minute=1):
        assert limiter.active_count == 1


def test_snapshot_preserves_copies_and_expires_after_thirty_minutes():
    """Check copy isolation and the inclusive 30-minute lookup boundary."""
    clock = Clock()
    store = SnapshotStore(clock=clock)
    profile = HouseholdProfile(
        city="delhi",
        routine_blocks=[
            RoutineBlock(label="School drop-off", start_time="08:00", end_time="08:45")
        ],
    )
    plan = PlanResponse(warnings=["Original warning"])
    assert store.remember(profile, plan) is plan
    assert plan.plan_id
    profile.routine_blocks[0].label = "Changed commitment"
    plan.warnings.append("Changed warning")

    clock.now = 1800.0
    baseline = store.get(plan.plan_id)
    assert baseline is not None
    saved_profile, saved_plan = baseline
    assert saved_profile.routine_blocks[0].label == "School drop-off"
    assert saved_plan.plan_id == plan.plan_id
    assert saved_plan.warnings == ["Original warning"]
    clock.now = 1800.001
    assert store.get(plan.plan_id) is None


def test_snapshot_store_evicts_oldest_without_promoting_reads():
    """Show that reads preserve insertion order and eviction removes the oldest entry."""
    store = SnapshotStore(clock=Clock())
    profile = HouseholdProfile(city="delhi")
    oldest = store.remember(profile, PlanResponse()).plan_id
    second = store.remember(profile, PlanResponse()).plan_id
    for _ in range(98):
        store.remember(profile, PlanResponse())
    assert store.get(oldest) is not None

    newest = store.remember(profile, PlanResponse()).plan_id
    assert store.get(oldest) is None
    assert store.get(second) is not None
    assert store.get(newest) is not None
    store.reset()
    assert store.get(newest) is None


async def test_air_cache_isolates_city_and_copies_until_exact_expiry():
    """Check city separation, copy isolation and expiry at exactly 600 seconds."""
    clock = Clock()
    cache = AirDataCache(clock=clock)
    context = await FixtureProvider().fetch(28.6, 77.2, "Delhi")
    expected = context.model_copy(deep=True)
    cache.remember("Delhi", context)
    context.quality_flags.append("Changed provider result")
    assert cache.get("Mumbai") is None

    clock.now = 599.999
    cached = cache.get("Delhi")
    assert cached is not None
    assert cached == expected
    cached.quality_flags.append("Changed cache result")
    assert cache.get("Delhi") == expected
    clock.now = 600.0
    assert cache.get("Delhi") is None
    cache.remember("Delhi", expected)
    cache.reset()
    assert cache.get("Delhi") is None


def test_breaker_returns_to_primary_at_cooldown_boundary():
    """Check that the backup loses priority at exactly 300 seconds."""
    clock = Clock()
    breaker = ModelCircuitBreaker(clock=clock)
    assert breaker.model_order("primary", "backup") == ("primary", "backup")
    breaker.record_transient_failure()
    clock.now = 299.999
    assert breaker.model_order("primary", "backup") == ("backup", "primary")
    clock.now = 300.0
    assert breaker.model_order("primary", "backup") == ("primary", "backup")


def test_breaker_reset_and_single_model_order():
    """Check reset and fallback when the backup name is blank or identical."""
    breaker = ModelCircuitBreaker(clock=Clock())
    breaker.record_transient_failure()
    assert breaker.model_order("primary", "primary") == ("primary", "primary")
    assert breaker.model_order("primary", "  ") == ("primary", "primary")
    assert breaker.model_order("primary", " backup ") == ("backup", "primary")
    breaker.reset()
    assert breaker.model_order("primary", "backup") == ("primary", "backup")
