"""Process-local planning admission, comparison snapshots, and live air data."""

from __future__ import annotations

import time
import uuid
from collections import OrderedDict, deque
from collections.abc import AsyncIterator, Callable
from contextlib import asynccontextmanager

from fastapi import HTTPException

from app.schemas import EnvironmentalContext, HouseholdProfile, PlanResponse

# Retain admitted requests over a rolling one-minute window.
RATE_WINDOW_SECONDS = 60
# Bound private snapshots in memory and expire them after 30 minutes.
MAX_SNAPSHOTS = 100
SNAPSHOT_TTL_SECONDS = 1800
# Reuse successful CAMS fetches briefly while the hourly model values update.
AIR_CACHE_TTL_SECONDS = 600


class PlanningLimiter:
    """Limit concurrent planning and admissions per rolling minute."""

    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        """Initialize an empty rolling window and no active calls."""
        self._clock = clock
        self._request_times: deque[float] = deque()
        self._active = 0

    @property
    def active_count(self) -> int:
        """Return the number of calls currently holding a slot."""
        return self._active

    @asynccontextmanager
    async def slot(self, max_concurrent: int, max_per_minute: int) -> AsyncIterator[None]:
        """Admit a plan with the current limits and release capacity on exit.

        Raises:
            HTTPException: A concurrency or rolling-window limit was reached.
        """
        now = self._clock()
        while self._request_times and now - self._request_times[0] >= RATE_WINDOW_SECONDS:
            self._request_times.popleft()
        if self._active >= max_concurrent or len(self._request_times) >= max_per_minute:
            raise HTTPException(429, "Planning is busy. Please try again shortly.")
        self._request_times.append(now)
        self._active += 1
        try:
            yield
        finally:
            self._active -= 1

    def reset(self) -> None:
        """Clear admission history while preserving any slots already held."""
        self._request_times.clear()


class SnapshotStore:
    """Hold private, expiring comparison baselines behind opaque plan IDs."""

    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        """Initialize the insertion-ordered snapshot store."""
        self._clock = clock
        self._snapshots: OrderedDict[str, tuple[float, HouseholdProfile, PlanResponse]] = (
            OrderedDict()
        )

    def remember(self, profile: HouseholdProfile, plan: PlanResponse) -> PlanResponse:
        """Assign an ID to the plan and retain deep copies of the comparison inputs."""
        self.prune()
        plan.plan_id = uuid.uuid4().hex
        self._snapshots[plan.plan_id] = (
            self._clock(),
            profile.model_copy(deep=True),
            plan.model_copy(deep=True),
        )
        while len(self._snapshots) > MAX_SNAPSHOTS:
            self._snapshots.popitem(last=False)
        return plan

    def get(self, plan_id: str) -> tuple[HouseholdProfile, PlanResponse] | None:
        """Return the stored baseline if its ID is still valid."""
        self.prune()
        snapshot = self._snapshots.get(plan_id)
        if snapshot is None:
            return None
        _, profile, plan = snapshot
        return profile, plan

    def prune(self) -> None:
        """Discard entries older than the comparison lifetime."""
        for key, (created, _, _) in list(self._snapshots.items()):
            if self._clock() - created > SNAPSHOT_TTL_SECONDS:
                del self._snapshots[key]

    def reset(self) -> None:
        """Discard all saved baselines."""
        self._snapshots.clear()


class AirDataCache:
    """Reuse successful live provider responses by canonical city label."""

    def __init__(self, clock: Callable[[], float] = time.monotonic) -> None:
        """Initialize an empty cache for the supported cities."""
        self._clock = clock
        self._entries: dict[str, tuple[float, EnvironmentalContext]] = {}

    def get(self, city_label: str) -> EnvironmentalContext | None:
        """Return a copy of a fresh entry or signal that a fetch is needed."""
        cached = self._entries.get(city_label)
        if cached and self._clock() - cached[0] < AIR_CACHE_TTL_SECONDS:
            return cached[1].model_copy(deep=True)
        return None

    def remember(self, city_label: str, context: EnvironmentalContext) -> None:
        """Store a copy of a successful live response at fetch completion."""
        self._entries[city_label] = (self._clock(), context.model_copy(deep=True))

    def reset(self) -> None:
        """Discard all cached provider responses."""
        self._entries.clear()
