# Saans

**Everyday air-quality planning for urban households.** Built for PromptWars Virtual, Challenge 06: Urban Air Quality Assistant.

- **Live app:** https://saans-wwwc.onrender.com
- **Demo video (2:13):** https://youtu.be/KyVVyveKvt8
- **Stack:** Python 3.11 · FastAPI · Pydantic · Google Gemini (`google-genai`) · Open-Meteo CAMS · vanilla JS/CSS

## The problem and the approach

City households see an air-quality number but rarely a practical next step that fits their day. Saans takes a household's city, fixed commitments (such as a school drop-off), budget, transport options and home resources. It returns up to three practical indoor-air and lower-emission actions, each with a reason, trade-off and cited source.

How a plan is made:

1. **Live air data:** the provider fetches Open-Meteo CAMS model data for the city and normalizes it, labelling source, timestamp and index scale (European AQI, not India's AQI).
2. **Deterministic eligibility:** rules in `app/rules.py` remove actions that conflict with the household's budget, resources, transport or constraints.
3. **Gemini ranks, Saans explains:** Gemini receives a reduced summary and the eligible action IDs, and returns up to three IDs as schema-constrained JSON (`app/planner.py`). The server rejects unknown, repeated or malformed IDs. All rendered advice, limitations and citations come from the reviewed catalogue (`knowledge/`), so the model never writes factual claims.
4. **What-if comparison:** users change a typed constraint (Metro unavailable, no purifier, no extra spending, more flexibility). The server re-plans against the stored original and shows actions added or removed. Fixed commitments are always preserved.
5. **Honest failure:** if Gemini is unavailable, rule-filtered fallback guidance is clearly labelled. If air data is unavailable, the plan says so.

## Evaluation criteria: what we did

| Criterion | Implementation | Evidence |
|---|---|---|
| **Problem alignment** | Location-aware live air data; routines with preserved fixed times; indoor-air, exposure and sustainable-transport actions; explained trade-offs | Demo video; `app/rules.py`; `knowledge/actions.json` |
| **Security** | Strict Content-Security-Policy (no inline script or style); no inline event handlers; all dynamic text HTML-escaped and only `http(s)` links rendered; 32 KiB request-body limit; typed and validated inputs; rate and concurrency limits; AI output validated against an allowlist; prompt-injection guard in the system instruction; upstream errors reduced to safe categories (no secrets or raw errors in responses or logs); `nosniff`, `DENY` framing, COOP, HSTS behind HTTPS | `app/security.py`, `app/planner.py`, `tests/test_hardening.py`, `tests/test_release.py` |
| **Efficiency** | 10-minute per-city cache of live air data (CAMS updates hourly); circuit breaker that sends requests to the backup model for 5 minutes after the primary fails; bounded 10 s per-call and 25 s total AI deadlines; one retry with jitter; ETag revalidation for static assets; reduced Gemini payload | `app/main.py`, `app/planner.py`, `tests/test_hardening.py` |
| **Testing** | 51 pytest tests (API, rules, AI recovery, security headers, CSP-safe markup, caching, breaker) plus Node unit tests for the frontend helpers; CI runs lint, format check and both suites on every push | `tests/`, `.github/workflows/ci.yml` |
| **Accessibility** | axe-core (WCAG 2.1 AA + best practices) reports 0 violations on every view at desktop and 390 px mobile; landmarks; labelled dialog; keyboard-operable tabs (arrow keys) and action cards (Enter/Space); live regions for status; reduced-motion support; AA text contrast | Audit method in `docs/verification.md` |
| **Code quality** | Typed Pydantic schemas; small single-purpose modules; ruff lint and format clean; locked dependencies (`uv.lock`, hashed `requirements.txt`) | `pyproject.toml`, CI workflow |

## Run locally

```powershell
uv sync --locked --extra dev
copy .env.example .env   # add GEMINI_API_KEY locally; never commit it
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`DATA_MODE=fixture` uses synthetic test data. The default, `live`, uses Open-Meteo CAMS. Without a Gemini key, plans use the labelled fallback.

### Tests and checks

```powershell
.\.venv\Scripts\python.exe -m pytest -q -o asyncio_default_fixture_loop_scope=function
node --test tests/frontend/app.test.js
.\.venv\Scripts\python.exe -m ruff check app tests
```

Tests force fixture data and blank AI credentials, so they make no network or paid model calls.

## Assumptions and limits

- CAMS Global is regional model data (~45 km), not street-level observation.
- Household resources and budget are self-reported; indoor air, routes and equipment effectiveness are not measured.
- Guidance is qualitative. No measured health benefit or calculated emissions saving is claimed, and it is not medical advice.
- Routine names, times and notes are never sent to Gemini. Temporary plan snapshots (max 100, 30-minute expiry) live in server memory for comparisons; the UI discloses this.
- Single-worker deployment: rate limits, snapshots and caches are process-local. Shared community coordination is not implemented.

## Project records

`DESIGN.md` covers trust boundaries; `docs/verification.md` holds dated evidence; `docs/release.md` covers hosting; `HANDOFF.md` and `TASKS.md` track work in progress.
