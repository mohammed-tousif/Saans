# Saans release guide

Updated 25 November 2026. The public Render service is https://saans-wwwc.onrender.com. The AI recovery build is live and verified. Competition submission is pending.

## Reproduce

Install Python 3.11 and uv, then run `uv sync --locked --extra dev` from the repository root. Run `uv run --locked pytest -q -o asyncio_default_fixture_loop_scope=function` and `node --check app/static/app.js`.

For a pip-based host, `python -m pip install --require-hashes -r requirements.txt` installs the exported pinned runtime dependencies. Run from the repository root so the curated knowledge files resolve correctly.

## Hosting configuration

Build command: `python -m pip install --require-hashes -r requirements.txt`
Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
Health path: `/health`
Python: 3.11. Use HTTPS on the hosting platform. Keep exactly one instance and one worker: snapshots and request budgets are process-local.

Set `GEMINI_API_KEY` in the hosting secret manager and use `DATA_MODE=live`. `GEMINI_MODEL` and `GEMINI_BACKUP_MODEL` default to `gemini-3.5-flash-lite`. The existing Render installation has 3.8 Flash configured as primary and successfully used Flash-Lite after a transient failure. Keep credentials out of source, footage, and submission text. If neither call yields usable output, the app labels the reviewed fallback guidance.

Render built the repository's Dockerfile on the existing Free service. The Procfile is available for compatible hosts.

## Release gates

- [x] Locked environment installed and 38 tests passed.
- [x] Browser: fixture planning, mobility preservation, comparison acceptance, repeat generation and changed household.
- [x] Phone-sized Today view inspected; no horizontal overflow observed.
- [x] 32 KiB request-body limit and no-store/frame/content-type protections.
- [x] Successful live Gemini generation and revised plan with Flash-Lite.
- [x] Public HTTPS app and API smoke test with a fictional household.
- [x] Public GitHub repository with source archive under 10 MB and single master branch.
- [x] User published LinkedIn post. Verify organizer mentions and actual build image before submitting.
- [ ] Record and upload the demo. Test playback without a login.
- [ ] User approves final submission; no attempts consumed by Codex.

## Known limitations

No indoor sensors, medical diagnosis, numerical emissions savings or health-outcome predictions. Seven enabled reviewed actions. In-memory baselines expire from use after 30 minutes and clear on restart. Global rate limits may temporarily affect all visitors. Inline HTML handlers remain; strict CSP and distributed abuse protection are future hardening, not completed controls. The pattern scanner reports 20 innerHTML findings; they are not a clean audit certificate. See DESIGN.md.
