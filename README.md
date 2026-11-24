# Saans

Local prototype of a household air-quality planner. Python/FastAPI serves a same-origin web interface. Gemini ranks eligible actions; source-backed text and schedule commitments are rendered by code. Missing AI credentials produce explicitly labelled fallback guidance.

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

Seven narrowed actions are enabled; others await evidence review. No indoor sensor, numerical emissions savings, clinical validation, public deployment or verified live Gemini integration is claimed. Comparison snapshots are held in process memory (up to 100), expire from use after 30 minutes, and are pruned on planning/comparison requests. Restarting clears them. Single-worker prototype only: rate limits and snapshots are not shared across workers.

Read HANDOFF.md, TASKS.md and the grounding correction register before changing code. See DESIGN.md for trust boundaries and known limits.

## Release and submission

See [release guide](docs/release.md) and [submission kit](docs/submission-kit.md). The official dashboard deadline is 29 November 2026 at 23:59 IST. Local tests pass; live Gemini generation and public deployment remain release gates.
