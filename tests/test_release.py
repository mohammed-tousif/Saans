import pytest
from fastapi.testclient import TestClient

from app import planner
from app.config import settings
from app.main import app
from app.providers import FixtureProvider
from app.schemas import HouseholdProfile


def test_oversized_body_is_rejected_before_parsing():
    with TestClient(app) as client:
        response = client.post("/api/plan", content=b"x" * 32769)
        assert response.status_code == 413
        assert response.headers["x-content-type-options"] == "nosniff"


def test_responses_are_not_cached_or_framed():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.headers["cache-control"] == "no-store"
        assert response.headers["x-frame-options"] == "DENY"


@pytest.mark.asyncio
async def test_valid_ai_selection_is_labelled_and_grounded(monkeypatch):
    monkeypatch.setattr(settings, "gemini_api_key", "test-placeholder")

    async def selected(profile, context, eligible, model):
        return [eligible[0]]

    monkeypatch.setattr(planner, "_select_with_gemini", selected)
    context = await FixtureProvider().fetch(28.6, 77.2, "Fictional Delhi")
    plan = await planner.generate_plan(HouseholdProfile(city="delhi"), context)
    assert plan.generation_mode.value == "ai"
    assert plan.model_id == settings.gemini_model
    assert len(plan.actions) == 1
    assert plan.actions[0].evidence_ids
    assert plan.environmental_context.source_kind.value == "fixture"
