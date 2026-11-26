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
| **Security** | Strict Content-Security-Policy on the product UI; dynamic content built as DOM nodes and text; only `http(s)` source links; 32 KiB body limit; rate and concurrency limits; validated AI action IDs and safe upstream error categories | `app/security.py`, `app/static/app.js`, `docs/security-scan.json`, browser tests |
| **Efficiency** | 10-minute per-city cache of live air data (CAMS updates hourly); circuit breaker that sends requests to the backup model for 5 minutes after the primary fails; bounded 10 s per-call and 25 s total AI deadlines; one retry with jitter; ETag revalidation for static assets; reduced Gemini payload | `app/main.py`, `app/planner.py`, `tests/test_hardening.py` |
| **Testing** | 64 backend tests with 88% combined statement and branch coverage in the latest local run, two frontend unit tests and six Chromium tests covering planning, comparison, stale responses, errors and accessibility. CI runs these checks and publishes the backend coverage report. | `tests/`, `.github/workflows/ci.yml`, `docs/verification.md` |
| **Accessibility** | Roving tab focus, native action buttons, labelled dialog with Escape and focus restoration, live regions and reduced-motion support. Automated axe-core checks reported zero violations across setup, plan, home, sources and comparison at 1280 and 390 px. | `tests/frontend/flow.spec.cjs`, `docs/verification.md` |
| **Code quality** | Typed schemas and focused Python and JavaScript modules. Ruff, mypy, ESLint and Prettier run in CI. Development and runtime dependencies are locked (`uv.lock`, hashed `requirements.txt`) | `pyproject.toml`, CI workflow |

## Run locally

```powershell
uv sync --locked --extra dev
copy .env.example .env   # add GEMINI_API_KEY locally; never commit it
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

`DATA_MODE=fixture` uses synthetic test data. The default, `live`, uses Open-Meteo CAMS. Without a Gemini key, plans use the labelled fallback.

### Tests and checks

```powershell
uv run coverage run --branch --source=app -m pytest -q -o asyncio_default_fixture_loop_scope=function
uv run coverage report -m
node --test tests/frontend/app.test.js
uv run ruff check app tests
uv run ruff format --check app tests
uv run mypy
npm ci --ignore-scripts
npm run lint
npm run format:check
node ./node_modules/@playwright/test/cli.js install chromium
node ./node_modules/@playwright/test/cli.js test
```

Tests force fixture data and blank AI credentials, so they make no external data or model calls. Browser tests launch and stop their own local fixture server. The automated accessibility checks cover the tested states and complement manual review.

## Code style and structure

Python follows [PEP 8](https://peps.python.org/pep-0008/) naming and indentation with this repository's 100-column limit. Ruff checks formatting, names, imports, common bugs and a complexity limit of 10. Mypy checks application code, including bodies of unannotated functions. Use type annotations on interfaces and give each function one responsibility.

JavaScript uses native modules, camelCase names, two-space indentation and single quotes. Prettier fixes formatting. ESLint checks undefined and unused names, common control-flow mistakes and a complexity limit of 12 for browser code. Use comments to explain decisions and constraints that the code cannot express by itself.

- app/rules.py handles catalogue eligibility and ordering. app/providers.py normalizes external air data. app/planner.py prepares reviewed plans and calls Gemini. app/main.py owns the HTTP routes and their temporary state.
- app/static/app.js coordinates the UI. api.js owns JSON requests and HTTP errors, profile.js owns form inputs, views.js renders results, and dom.js owns safe element and link helpers.

CI runs the static checks, backend coverage and browser tests from a clean checkout. Browser tests use fixture data so they can reproduce stale-response, comparison, accessibility and validation cases without Gemini.

## Assumptions and limits

- CAMS Global is regional model data (~45 km), not street-level observation.
- Household resources and budget are self-reported; indoor air, routes and equipment effectiveness are not measured.
- Guidance is qualitative. No measured health benefit or calculated emissions saving is claimed, and it is not medical advice.
- Routine names, times and notes are never sent to Gemini. Temporary plan snapshots (max 100, 30-minute expiry) live in server memory for comparisons; the UI discloses this.
- Single-worker deployment: rate limits, snapshots and caches are process-local. Shared community coordination is not implemented.

## What changed after attempt one

Attempt one used commit 8f9c8a5. The 26 November refactor keeps the same catalogue, planning flow and public form links while making the implementation easier to follow and test.

| Area | What changed | Verification |
|---|---|---|
| Action rules | app/rules.py separates available resources, household exclusions, pollution conditions and sorting. Removed three unused validators that duplicated checks already owned by the planner. | The eligible IDs and their order matched the attempt-one implementation across 896 combinations of budget, transport, resources, household needs and AQI. |
| CAMS provider | app/providers.py parses timestamps, pollutants, index values and coordinates in focused helpers. Invalid unit metadata flags the affected pollutant and keeps valid readings. Invalid coordinates use the requested city coordinates. | Tests cover missing or malformed units, coordinates, numeric values and freshness. |
| HTTP and AI | app/main.py shares the snapshot creation path between planning and comparison. Comparison changes use plan order. app/security.py bounds the body while reading chunks and replays it once. app/planner.py separates model failures from plan assembly and types the Gemini SDK call. | Regression tests check comparison baselines, request limits, multi-chunk bodies, disconnects and labelled AI fallback. |
| Frontend | app.js coordinates requests and state. api.js handles JSON requests and errors, profile.js owns the form, views.js renders results, and dom.js builds safe elements. A successful response updates the plan and its profile together. | Chromium covers planning, comparison, keyboard navigation, validation, accessibility, a response arriving after a profile edit, and expired comparisons. |
| Automated checks | CI now enforces Ruff naming and complexity rules, mypy type checking, ESLint and Prettier. The backend and browser suites use controlled fixtures. | 64 backend tests, 88% backend coverage, two frontend unit tests and six Chromium tests passed locally before publication. CI runs the same checks on pushes. |

For the next editor, start with [HANDOFF.md](HANDOFF.md) for the currently deployed commit, live verification, competition status and the next tasks. Use [docs/verification.md](docs/verification.md) for dated test results and [docs/submission-kit.md](docs/submission-kit.md) for the form text.

## Project records

`DESIGN.md` covers trust boundaries; `docs/verification.md` holds dated evidence; `docs/release.md` covers hosting; `HANDOFF.md` and `TASKS.md` track work in progress.
