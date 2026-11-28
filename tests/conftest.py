"""Shared test isolation: process-wide caches and breakers start clean for every test."""

import pytest

from app import main, planner


@pytest.fixture(autouse=True)
def reset_process_state():
    """Clear the shared breaker and air cache on both sides of each test."""
    planner.model_circuit_breaker.reset()
    main.air_data_cache.reset()
    yield
    planner.model_circuit_breaker.reset()
    main.air_data_cache.reset()
