"""Check release safeguards for HTTP responses and grounded AI output."""

import pytest
from fastapi.testclient import TestClient

from app import planner
from app.config import settings
from app.main import app
from app.providers import FixtureProvider
from app.schemas import HouseholdProfile


def test_oversized_body_is_rejected_before_parsing():
    """Return a guarded 413 even when the oversized payload is not valid JSON."""
    with TestClient(app) as client:
        response = client.post("/api/plan", content=b"x" * 32769)
        assert response.status_code == 413
        assert response.headers["x-content-type-options"] == "nosniff"


def test_responses_are_not_cached_or_framed():
    """Keep API responses out of caches and prevent them from loading in frames."""
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.headers["cache-control"] == "no-store"
        assert response.headers["x-frame-options"] == "DENY"


def test_developer_docstrings_preserve_public_openapi_descriptions():
    """Keep developer-only docs out of public schema sections that lack descriptions."""
    with TestClient(app) as client:
        response = client.get("/openapi.json")
    response.raise_for_status()
    contract = response.json()
    assert "description" not in contract["paths"]["/api/plan"]["post"]
    schemas = contract["components"]["schemas"]
    assert "description" not in schemas["PlanRequest"]
    assert "description" not in schemas["BudgetBand"]
    assert schemas["HouseholdProfile"]["description"] == "Household inputs for plan generation."


@pytest.mark.asyncio
async def test_valid_ai_selection_is_labelled_and_grounded(monkeypatch):
    """Check that an eligible model-selected ID resolves to evidence-backed advice."""
    monkeypatch.setattr(settings, "gemini_api_key", "test-placeholder")

    async def selected(profile, context, eligible, model):
        """Simulate a successful model response with the first eligible action."""
        return [eligible[0]]

    monkeypatch.setattr(planner, "_select_with_gemini", selected)
    context = await FixtureProvider().fetch(28.6, 77.2, "Fictional Delhi")
    plan = await planner.generate_plan(HouseholdProfile(city="delhi"), context)
    assert plan.generation_mode.value == "ai"
    assert plan.model_id == settings.gemini_model
    assert len(plan.actions) == 1
    assert plan.actions[0].evidence_ids
    assert plan.environmental_context.source_kind.value == "fixture"
