"""Shared test isolation: process-wide caches and breakers start clean for every test."""

import pytest

from app import main, planner


@pytest.fixture(autouse=True)
def reset_process_state():
    planner.reset_model_cooldown()
    main._air_cache.clear()
    yield
    planner.reset_model_cooldown()
    main._air_cache.clear()
