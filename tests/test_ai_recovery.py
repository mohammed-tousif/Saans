import pytest
from google.genai.errors import ClientError, ServerError

from app import planner
from app.config import settings
from app.providers import FixtureProvider
from app.schemas import HouseholdProfile


@pytest.mark.asyncio
@pytest.mark.parametrize("recover", [True, False])
async def test_transient_failure_retries_once_and_preserves_truth(monkeypatch, caplog, recover):
    monkeypatch.setattr(settings, "gemini_api_key", "test-placeholder")
    monkeypatch.setattr(settings, "gemini_model", "gemini-3.8-flash")
    monkeypatch.setattr(settings, "gemini_backup_model", "gemini-3.5-flash-lite")
    calls = []

    async def select(profile, context, eligible, model):
        calls.append(model)
        if recover and len(calls) == 2:
            return [eligible[0]]
        raise ServerError(503, {"error": {"message": "secret-upstream-detail"}})

    async def no_delay(seconds):
        pass

    monkeypatch.setattr(planner, "_select_with_gemini", select)
    monkeypatch.setattr(planner.asyncio, "sleep", no_delay)
    context = await FixtureProvider().fetch(28.6, 77.2, "Fictional Delhi")
    plan = await planner.generate_plan(HouseholdProfile(city="delhi"), context)
    assert calls == ["gemini-3.8-flash", "gemini-3.5-flash-lite"]
    assert plan.generation_mode.value == ("ai" if recover else "fallback")
    assert plan.model_id == ("gemini-3.5-flash-lite" if recover else None)
    assert all(action.evidence_ids for action in plan.actions)
    assert "secret-upstream-detail" not in plan.model_dump_json() + caplog.text
    if not recover:
        assert "temporarily unavailable" in " ".join(plan.warnings)


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "error", [ClientError(403, {}), ClientError(404, {}), ValueError("bad IDs")]
)
async def test_permanent_or_invalid_response_is_not_retried(monkeypatch, error):
    calls = []

    async def broken(*args):
        calls.append(1)
        raise error

    monkeypatch.setattr(planner, "_select_with_gemini", broken)
    with pytest.raises(type(error)):
        await planner.select_with_retry(None, None, [])
    assert len(calls) == 1


@pytest.mark.asyncio
async def test_timeout_retries_only_once(monkeypatch):
    calls = []

    async def broken(*args):
        calls.append(1)
        raise TimeoutError()

    async def no_delay(seconds):
        pass

    monkeypatch.setattr(planner, "_select_with_gemini", broken)
    monkeypatch.setattr(planner.asyncio, "sleep", no_delay)
    with pytest.raises(TimeoutError):
        await planner.select_with_retry(None, None, [])
    assert len(calls) == 2
