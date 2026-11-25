# Saans

Local prototype of a household air-quality planner. Python/FastAPI serves a same-origin web interface. Gemini ranks eligible actions; source-backed text and schedule commitments are rendered by code. Missing AI credentials produce explicitly labelled fallback guidance.

## Challenge and approach

Chosen vertical: **PromptWars Challenge 06 — Urban Air Quality Assistant**. Saans helps an urban household choose practical indoor-air and lower-emission actions around daily commitments. The current implementation focuses on households; shared community coordination is not implemented.

The user selects a city, budget, transport, household resources and routine. The provider normalizes city-level air data, including its source, timestamp and index scale. Deterministic rules remove actions that conflict with resources, budget or constraints. Gemini ranks up to three remaining action IDs; the server rejects unknown, repeated or malformed choices. Reviewed catalogue text supplies explanations, limitations and source links. If AI fails, the interface explicitly labels the rule-filtered fallback.

The user can change a typed constraint, compare against the saved original plan, and accept the revision. Fixed routine times remain unchanged. Environmental data quality and AI availability are separate states.

## Assumptions

- Open-Meteo/CAMS Global provides regional model data, approximately 45 km resolution, not street-level observations. European AQI is labelled explicitly; it is not India's AQI.
- Household resource and budget selections are self-reported. Indoor pollution, route conditions and equipment effectiveness are not measured.
- Guidance explains qualitative possibilities and tradeoffs, not measured health gains or calculated emissions savings. It does not replace medical advice.
- Routine labels/times and additional notes are not sent to Gemini. A reduced summary includes city, resources, budget, transport and household-needs categories. Temporary server snapshots support comparison; the UI discloses this data use.
- This is a single-worker prototype. A working fallback is not proof of successful GenAI. See [current compliance audit](docs/compliance-audit.md) for unresolved release gates and official rules.

## Start on Windows

From this folder, use the existing environment:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

For a fresh environment, install Python 3.11 and uv, then run `uv sync --locked --extra dev`. The runtime export in `requirements.txt` contains pinned versions and hashes. See docs/release.md for hosting configuration.

Copy `.env.example` to `.env` locally if needed. Configure `GEMINI_API_KEY` and an account-available `GEMINI_MODEL` without sharing secrets in chat. `DATA_MODE=fixture` is synthetic test data; the default is live Open-Meteo/CAMS. Review provider terms before public deployment.

```powershell
.\.venv\Scripts\python.exe -m pytest -q -o asyncio_default_fixture_loop_scope=function
node --check app/static/app.js
```

## State and limits

The public app runs on Render. Live verification on 25 November 2026 confirmed CAMS model data, Gemini 3.5 Flash-Lite planning, and AI-assisted constraint comparison. Seven reviewed actions are enabled. Impact explanations are qualitative and indoor conditions are unmeasured. Comparison snapshots are held in process memory (up to 100), expire from use after 30 minutes, and are pruned on planning/comparison requests. Restarting clears them. Rate limits and snapshots are process-local.

Read HANDOFF.md, TASKS.md and the grounding correction register before changing code. See DESIGN.md for trust boundaries and known limits.

## Release and submission

[Open the public app](https://saans-wwwc.onrender.com). See the [release guide](docs/release.md) and [submission kit](docs/submission-kit.md). The official dashboard deadline is 29 November 2026 at 23:59 IST. The video is still pending.
