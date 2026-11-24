# Saans release guide

Prepared 24 November 2026. Local release candidate, not a deployed or submitted product.

## Reproduce

Install Python 3.11 and uv, then run `uv sync --locked --extra dev` from the repository root. Run `uv run --locked pytest -q -o asyncio_default_fixture_loop_scope=function` and `node --check app/static/app.js`.

For a pip-based host, `python -m pip install --require-hashes -r requirements.txt` installs the exported pinned runtime dependencies. Run from the repository root so the curated knowledge files resolve correctly.

## Hosting configuration

Build command: `python -m pip install --require-hashes -r requirements.txt`
Start command: `python -m uvicorn app.main:app --host 0.0.0.0 --port $PORT --workers 1`
Health path: `/health`
Python: 3.11. Use HTTPS on the hosting platform. Keep exactly one instance and one worker: snapshots and request budgets are process-local.

Set GEMINI_API_KEY in the hosting secret manager, GEMINI_MODEL=gemini-3.8-flash, DATA_MODE=live. Never place credentials in source, client code, screenshots or submission text. If Google generation fails, the app shows fallback guidance; this does not satisfy successful live AI verification.

Dockerfile and Procfile are prepared. Docker image build and hosted deployment have not been verified. No paid hosting has been authorized. Choose the user's hosting account before creating resources; present actual settings and costs before publishing.

## Release gates

- [x] Locked environment installed and 32 tests passed.
- [x] Browser: fixture planning, mobility preservation, comparison acceptance, repeat generation and changed household.
- [x] Phone-sized Today view inspected; no horizontal overflow observed.
- [x] 32 KiB request-body limit and no-store/frame/content-type protections.
- [ ] Successful live Gemini generation (metadata succeeds; generation returns server error).
- [ ] Public HTTPS app and clean-session smoke test.
- [ ] Public GitHub repository under 10 MB (no remote configured at inspection).
- [ ] Record/upload demo and publish approved LinkedIn post.
- [ ] User approves final submission; no attempts consumed by Codex.

## Known limitations

No indoor sensors, medical diagnosis, numerical emissions savings or health-outcome predictions. Seven enabled reviewed actions. In-memory baselines expire from use after 30 minutes and clear on restart. Global rate limits may temporarily affect all visitors. Inline HTML handlers remain; strict CSP and distributed abuse protection are future hardening, not completed controls. The pattern scanner reports 20 innerHTML findings; they are not a clean audit certificate. See DESIGN.md.
