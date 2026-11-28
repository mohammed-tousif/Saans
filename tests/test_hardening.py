"""Security headers, CSP-safe frontend markup, model circuit breaker and air-data cache."""

import re
import shutil
import subprocess
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from google.genai.errors import ServerError

from app import main, planner
from app.config import settings
from app.planning_state import AirDataCache
from app.providers import FixtureProvider
from app.schemas import HouseholdProfile

STATIC = Path(__file__).resolve().parent.parent / "app" / "static"


# --- Security headers -------------------------------------------------------


def test_pages_carry_strict_content_security_policy():
    """Check that the app page limits scripts, embedding and plug-in content."""
    with TestClient(main.app) as client:
        csp = client.get("/").headers["content-security-policy"]
    assert "script-src 'self'" in csp
    assert "frame-ancestors 'none'" in csp
    assert "object-src 'none'" in csp
    assert "unsafe-inline" not in csp and "unsafe-eval" not in csp


def test_interactive_docs_are_exempt_from_page_csp():
    """Keep the separate policy exception required by the interactive docs."""
    with TestClient(main.app) as client:
        assert "content-security-policy" not in client.get("/docs").headers


def test_static_assets_revalidate_while_api_is_never_stored():
    """Distinguish revalidatable JavaScript from non-stored API responses."""
    with TestClient(main.app) as client:
        assert client.get("/static/app.js").headers["cache-control"] == "no-cache"
        assert client.get("/health").headers["cache-control"] == "no-store"


def test_hsts_only_behind_https():
    """Check the HTTPS policy behind a proxy without forcing TLS in local HTTP tests."""
    with TestClient(main.app) as client:
        assert "strict-transport-security" not in client.get("/health").headers
        secure = client.get("/health", headers={"x-forwarded-proto": "https"})
    assert secure.headers["strict-transport-security"].startswith("max-age=")


# --- CSP-compatible frontend ------------------------------------------------


@pytest.mark.parametrize("name", ["index.html", *sorted(path.name for path in STATIC.glob("*.js"))])
def test_frontend_has_no_inline_handlers_or_style_attributes(name):
    """Guard the markup conventions required by the page policy."""
    source = (STATIC / name).read_text(encoding="utf-8")
    assert not re.search(r"\son[a-z]+\s*=\s*[\"']", source), "inline event handler"
    assert 'style="' not in source, "inline style attribute"


def test_index_has_no_inline_scripts():
    """Require browser scripts to load from an external file."""
    html = (STATIC / "index.html").read_text(encoding="utf-8")
    assert all("src=" in tag for tag in re.findall(r"<script[^>]*>", html))


# --- Model circuit breaker --------------------------------------------------


@pytest.fixture
def two_models(monkeypatch):
    """Configure distinct fake model names and skip the real retry delay."""
    monkeypatch.setattr(settings, "gemini_api_key", "test-placeholder")
    monkeypatch.setattr(settings, "gemini_model", "primary-model")
    monkeypatch.setattr(settings, "gemini_backup_model", "backup-model")

    async def no_delay(seconds):
        """Allow retries to complete immediately."""
        pass

    monkeypatch.setattr(planner.asyncio, "sleep", no_delay)


@pytest.mark.asyncio
async def test_failing_primary_is_skipped_during_cooldown(monkeypatch, two_models):
    """Verify that a transient primary failure makes later requests prefer the backup."""
    calls = []

    async def select(profile, context, eligible, model):
        """Fail the primary and return an eligible action from the backup."""
        calls.append(model)
        if model == "primary-model":
            raise ServerError(503, {"error": {"message": "busy"}})
        return [eligible[0]]

    monkeypatch.setattr(planner, "_select_with_gemini", select)
    context = await FixtureProvider().fetch(28.6, 77.2, "Fictional Delhi")
    first = await planner.generate_plan(HouseholdProfile(city="delhi"), context)
    second = await planner.generate_plan(HouseholdProfile(city="delhi"), context)
    assert calls == ["primary-model", "backup-model", "backup-model"]
    assert first.model_id == second.model_id == "backup-model"


@pytest.mark.asyncio
async def test_primary_is_retried_after_cooldown(monkeypatch, two_models):
    """Advance the clock and verify the original model priority is restored."""
    now = 0.0
    breaker = planner.ModelCircuitBreaker(clock=lambda: now)
    monkeypatch.setattr(planner, "model_circuit_breaker", breaker)
    models = settings.gemini_model, settings.gemini_backup_model
    assert breaker.model_order(*models) == ("primary-model", "backup-model")
    breaker.record_transient_failure()
    assert breaker.model_order(*models) == ("backup-model", "primary-model")
    now = 300.0
    assert breaker.model_order(*models) == ("primary-model", "backup-model")


@pytest.mark.asyncio
async def test_permanent_errors_do_not_open_the_breaker(monkeypatch, two_models):
    """Check that a bad response leaves the primary first in the next request."""

    async def invalid(profile, context, eligible, model):
        """Simulate a model result that cannot pass validation."""
        raise ValueError("unusable model output")

    monkeypatch.setattr(planner, "_select_with_gemini", invalid)
    with pytest.raises(ValueError):
        await planner.select_with_retry(None, None, [])
    models = settings.gemini_model, settings.gemini_backup_model
    assert planner.model_circuit_breaker.model_order(*models)[0] == "primary-model"


# --- Air-data cache -----------------------------------------------------------


class CountingProvider:
    """Count provider fetches while returning a real fixture record."""

    def __init__(self):
        """Start with no recorded fetches."""
        self.calls = 0

    async def fetch(self, latitude, longitude, label):
        """Count the call and delegate synthetic readings to the fixture provider."""
        self.calls += 1
        return await FixtureProvider().fetch(latitude, longitude, label)


@pytest.mark.asyncio
async def test_live_air_data_is_reused_within_ttl(monkeypatch):
    """Check that one upstream response serves repeated calls as independent objects."""
    provider = CountingProvider()
    monkeypatch.setattr(settings, "data_mode", "live")
    monkeypatch.setattr(main, "get_provider", lambda *args: provider)
    first = await main.environment("delhi")
    second = await main.environment("delhi")
    assert provider.calls == 1
    assert first == second and first is not second


@pytest.mark.asyncio
async def test_expired_or_fixture_air_data_is_refetched(monkeypatch):
    """Verify that fixture mode bypasses the cache and live mode refreshes at expiry."""
    provider = CountingProvider()
    monkeypatch.setattr(main, "get_provider", lambda *args: provider)
    monkeypatch.setattr(settings, "data_mode", "fixture")
    await main.environment("delhi")
    await main.environment("delhi")
    assert provider.calls == 2
    monkeypatch.setattr(settings, "data_mode", "live")
    now = 0.0
    monkeypatch.setattr(main, "air_data_cache", AirDataCache(clock=lambda: now))
    await main.environment("delhi")
    now = 600.0
    await main.environment("delhi")
    assert provider.calls == 4


# --- Frontend unit tests (Node's built-in runner) ------------------------------


@pytest.mark.skipif(shutil.which("node") is None, reason="Node.js not installed")
def test_frontend_unit_tests_pass():
    """Run the Node unit tests as part of the backend regression suite."""
    root = Path(__file__).resolve().parent.parent
    files = [str(f) for f in sorted((root / "tests" / "frontend").glob("*.test.js"))]
    result = subprocess.run(
        ["node", "--test", *files], cwd=root, capture_output=True, text=True, timeout=60
    )
    assert result.returncode == 0, result.stdout + result.stderr
