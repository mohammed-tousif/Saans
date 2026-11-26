# Decisions

## 18–19 November 2026 — Codex repair pass

1. Canonical shared resume record is [HANDOFF.md](process/HANDOFF.md). Every agent updates it after meaningful chunks; quota readings are not assumed available.
2. Use constrained AI action ranking plus curated factual explanations. Do not render model-generated health claims or evidence IDs. This is a deliberate scope reduction pending stronger validation.
3. Disable eight inherited advice records pending claim-level review; narrow seven enabled records. Do not re-enable merely to make the demo more impressive.
4. Apply typed constraint codes to the real household profile. Store bounded temporary baselines so comparisons use the actual original plan.
5. Use explicit CAMS Global domain at approximately 45 km and offset-aware timestamps. Invalid measurements/unknown units are omitted with flags.
6. Enforce process-local request/concurrency limits and a model timeout. Production multi-worker controls remain unresolved.
7. Keep the loading element outside replaceable air-card markup to support accepting/recreating plans repeatedly.

## 21 November 2026 — evidence-based follow-up review

Do not attribute the whole working-tree diff to Antigravity: it includes prior Codex edits and only one old commit exists. Treat three newer frontend additions as inferred follow-up work. Keep backend live-Gemini verification blocked until credentials are actually configured. Flag privacy/availability copy for correction rather than accepting UI text as evidence.


## 24 November 2026 — Codex continuation

Preserve the inherited reduced Gemini payload and strict local response validation. Disclose all shared household-needs categories and temporary server snapshots. Configuration is not evidence of data availability or model success. An HTTP 503 is not enough to conclude a model ID is invalid; do not silently replace it on that evidence.


24 Nov release pass (Codex): official signed-in Challenge 6 form and deadline verified; see [HANDOFF.md](process/HANDOFF.md). Model metadata succeeds but live generation still fails safely. Release preparation in progress.


## 24 November 2026 — release checkpoint

Use uv.lock plus hashed production export and single-worker deployment. Keep model setting unchanged: model metadata confirms validity and an alternative also fails, so service failure must not be disguised as working AI. Signed-in Challenge 6 form supersedes earlier inferred requirements and narrower public tool restriction. Release drafts explicitly preserve unverified items.


24 Nov deployment pass: user supplied empty GitHub repository mohammed-tousif/Saans and signed-in Render; Codex preparing authorized free deployment. Secret scan passed for candidate files; no .env history. Deployment pending verification.


## 25 November 2026 — clay frontend

Follow user claymorphism direction: warm ivory, sage and peach, tactile inset/outset surfaces and original CSS sculpture. Preserve backend and DOM hooks. Use in-app browser for local QA while Chrome unavailable; do not infer deployment success or create duplicate Render services.

## 25 November 2026 — official compliance audit (Codex)

Read the signed-in Chrome challenge, full submission Instructions and linked guide, full video guide, resources/notices, public event FAQs, general terms and credits guide. Findings and source URLs: docs/compliance-audit.md. New requirements: one branch; explicit README vertical/logic/operation/assumptions; video under four minutes with live typed inputs, success/error tests, actual AI prompt/response and dynamic behavior; social photo, hashtags and tags. README and submission kit corrected. No application source changed in this audit.

Fresh tests: 32 passed in 0.47s. Remote heads verified only master at 40dc19e; GitHub visibly Public. Concept aligned, submission NOT ready: real AI/host verification, community/personalization/impact depth, accessibility/security evidence, video and social links remain. Generic team/IP/presentation terms conflict with event-specific material; organizer clarification needed, not silently waived. No submission or social publishing; attempts remain 0/3.

## 25 November 2026 — hosted verification and social artwork (Codex)

User confirms solo participation is valid and reports adding Gemini settings in Render and rebuilding. Chrome verified service srv-dc2sharncjis73dsf7gg on Free Docker, latest environment-triggered deploy dep-dc3hl4brjlhs73fsrua0 Live at commit 40dc19e. Public URL: https://saans-wwwc.onrender.com. App and city/source endpoints load; health logs show 200. Fictional school-parent plan returns real Open-Meteo/CAMS model data (European AQI labelled) and preserves school times. Gemini still fails: application log at 23:00:24 IST says AI selection unavailable: ServerError; UI honestly renders fallback. This proves deployment and live data, NOT successful AI. No secrets viewed or changed by Codex. No submission performed.

Generated minimal PromptWars/Saans conceptual social graphic at output/social/saans-promptwars.png (~2.06 MB). Use alongside actual app/setup screenshot for event photo requirement; graphic is not an actual screenshot. No social post published. Video not recorded yet; real AI remains a blocker. Next: diagnose upstream AI failure without exposing secrets, complete product gaps, record compliant demo. Existing local process unchanged.

## 25 November 2026 — Gemini outage diagnosis and recovery (Codex)

Minimal direct REST request to configured gemini-3.8-flash returned HTTP503 UNAVAILABLE, explicitly high demand; excludes app schema as cause for that request. SDK request hit deadline. Listed alternative gemini-3.5-flash timed out; gemini-2.5-flash returned404 unavailable to new users. No model/env change. Local key may differ from Render; hosted logs separately confirmed ServerError. Upstream recovery is NOT proven.

Code: explicit single SDK attempt, 10-second per-call deadline, one application retry with jitter for503/5xx,429,timeouts, outer25-second bound; permanent/invalid responses not retried. Removed deprecated temperature parameter per official troubleshooting docs. UI/logs use closed safe failure categories, never raw exception content. Tests:38 passed0.67s, including transient recovery, persistent outage, no retry on403/404/invalid selection, and timeout attempt limit. Official reference https://aistudio.google.com/docs/troubleshooting. This improves recovery/diagnostics; it cannot repair Google service capacity.

LinkedIn provided and verified by Chrome: https://www.linkedin.com/posts/mohammed-tousif-malekopp-4370792bb_buildwithai-promptwarsvirtual-challenge6-share-7531409733522534401-loH2/ . Visibility Global, all three hashtags, generated artwork; organizer handles are plain text, not linked mentions. User published it; Codex did not. Anonymous-access verification and actual build photo remain pending. Solo validity confirmed by user.

Next: deploy and inspect recovery build on Render; verify a successful actual Gemini plan when upstream available; finish demo and remaining compliance gaps. No attempt consumed. No local server started/stopped.

Recovery deployment verified: commit9b97827 pushed to master; Render marks it Live (35.1s build). Final hosted fictional request returned200 in14.77s, fallback, and new explicit Google service unavailable warning. Application-side recovery fix is deployed; successful real AI remains externally blocked. No claims of complete resolution. Initial pre-rollout request returned old generic warning; final result supersedes it. Next three tasks: verify Google recovery or a proven accessible alternative; finish product/demo gaps; correct LinkedIn real mentions/build image and final submission material. No submission attempted.

## 25 November 2026 — Gemini backup verified locally (Codex)

Active editor: Codex. Existing launch command is .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8016. No local server started or stopped in this pass. The prior Render release still used reviewed fallback in a fresh live check. Direct structured requests returned 503 on 3.8 Flash via both generation endpoints. 3.5 Flash-Lite returned valid JSON. Patched planner tried the configured 3.8 Flash primary then used 3.5 Flash-Lite successfully in 3.67s using the local key, a fictional household and synthetic air context.

The planner uses explicit JSON schema and low thinking for Gemini 3, keeps the deadline and validates selected IDs against eligible reviewed actions. A transient failure triggers one attempt with the configured backup. The response labels the model that actually produced the selection. New local default is Flash-Lite. Existing Render vars need no changes for the backup path. No secrets touched. 38 tests passed, lint and whitespace checks passed.

Next three tasks: publish and verify Render AI plan and comparison, record the submission demo using verified behavior, and review the LinkedIn mentions and final submission links. No competition attempt used.

## 25 November 2026 — working AI verified on Render (Codex)

Active editor: Codex. Render auto-deployed application commit 7c41173 in 26.6s. https://saans-wwwc.onrender.com returned AI mode with gemini-3.5-flash-lite and live CAMS model context for a fictional Delhi household. Initial plan took 5.38s and returned ACT001, ACT004, ACT007. Comparison took 3.36s. Disabling transit and purifier and choosing zero extra spend removed ACT004, kept the stored baseline unchanged, and preserved school drop-off 08:00–08:45. End time before start returned HTTP422. This verifies live plan and comparison API paths. No browser UX retest in this pass. Gemini 3.8 Flash still returned503 in direct tests. The working backup used the existing Gemini key; no Render settings or secrets were changed. 38 tests passed. Source tree was 711,534 bytes and ZIP 256,799 bytes at the application commit.

The linked public repository and deployed app are ready. User-published LinkedIn post is saved in the submission kit. Video remains pending and the last inspected attempt count was 0/3. Docs updated with the verified demo scenario and GenAI wording. Next three tasks: record and verify a live demo under four minutes; check actual organizer mentions/build image and anonymous access; recheck final links and attempt status with the user. No local server process changed. Local launch is .\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8016.

## 26 November 2026 — submission link status check (Codex)

Read-only project check. Saans public health returned 200 in live configuration. GitHub's unauthenticated API showed Public (291 KB reported) and the remote has only master at 2301da4. The user-provided LinkedIn short link redirected to the direct post and returned 200 with matching narrative in an anonymous session. Organizer mentions were plain text at the last visual inspection, and an actual build image still needs confirmation in the post. No demo video link found in the submission records or local deliverables. Chrome was unavailable for a fresh signed-in attempt count. Last verified count remains 0/3. No publication, submission or runtime changes. Active application-editor ownership unchanged.

Next three tasks: record and upload the live demo, confirm the organizer mentions and build image, and review final form values and the attempt counter before submission. See the 26 November live re-verification above for actual AI and comparison results.


## 26 November 2026 — demo evidence (Claude Code)
- The Gemini input/output in the video is a local capture from the deployed planner code with the same fictional profile, labelled as such on screen. The live request body is not exposed by the app, and adding a debug endpoint to production was rejected.
- The demo constraint is chosen to match an action the AI actually selected. A take whose selection could not show a change was discarded rather than forced.
- output/ stays untracked: the video (7.7 MB) would push the repo toward the 10 MB limit.


## 26 November 2026 — hardening choices (Claude Code)
- CSP allows Google Fonts rather than self-hosting the fonts, to keep the diff small; no 'unsafe-inline' anywhere.
- The air cache applies only in live mode, so fixture tests stay deterministic. The breaker opens only for transient errors (5xx, timeout, 429) on a distinct primary.
- One muted text color replaces 12 near-identical sage tones to pass AA; the visual hierarchy stays the same.
- Frontend tests use Node's built-in runner (no new npm dependencies in the repo).

## 26 November 2026 — pre-attempt gap closure (Codex)

Active editor: Codex for this pass. Latest inherited release already contained strict CSP, live AI/cache/breaker, 51 backend tests, a six-criteria README and the published demo. Codex replaced every frontend HTML-string rendering assignment with DOM/text operations and added native action buttons, roving tabs, evidence focus and revised-plan focus. Source URLs still use the HTTP(S) allowlist. Browser suite runs the local fixture backend on port 8019 with the API key blank. Playwright starts and stops that server. Local launch remains uv run uvicorn app.main:app --host 127.0.0.1 --port 8016.

Local verification before final rerun: 51 backend tests, 82% combined statement/branch coverage, 2 Node unit tests, 4 Chromium tests. Chromium verified keyboard navigation, evidence focus, literal commitment text, comparison/acceptance, invalid-time error, and zero axe violations on setup, today, home, sources and comparison at widths 1280px and 390px. Earlier contrast runs measured the page mid-fade. The current suite waits for finite animations and fonts. Security scan has zero high/critical findings and one medium pattern for non-security retry jitter. Added coverage and browser checks to CI; expanded README evidence. No submission action taken.

Next three tasks: validate the final local build and publish safely, verify Render and CI on the new commit, and hand the reviewed form values to the user for attempt one. Uploaded demo remains https://youtu.be/KyVVyveKvt8. LinkedIn mentions were verified by Claude, and the real build photo still needs placement or organizer clarification.

## 26 November 2026 — pre-attempt build verified on Render and CI (Codex)

Commit 8f9c8a5 was pushed to master. Render served app.js byte-for-byte from that commit, the homepage returned 200 with the strict CSP, and a new fictional Delhi plan returned 200 in AI mode using gemini-3.5-flash-lite with live CAMS model context. GitHub CI completed successfully for that exact commit including coverage and Chromium: https://github.com/mohammed-tousif/Saans/actions/runs/45841908598. Tracked tree 838,124 bytes; packed history measured 8,933,179 bytes (below 10 MB). Keep video and screen captures out of Git. Final local verification: 51 backend tests (82% coverage), two Node unit tests, four Chromium tests including 10 axe view/viewport scans, Ruff and whitespace passed. No HTML-string sinks found in the product frontend. Local fixture server 8019 was started and stopped by Playwright.

The submission kit's 781-character changes field now describes the live app and verified checks. Demo https://youtu.be/KyVVyveKvt8 already published by Claude. Real build screenshot available at output/demo/saans-live-plan.png. Live AI internals were tested through the API on this deployment; full DOM journey validated locally with fixtures. No competition attempt taken by Codex. Last signed-in counter was 0/3, as verified earlier on 26 Nov by Claude.

Next three tasks: address the real LinkedIn build image per the organizer's guidance; user reviews the form and makes attempt one; inspect feedback and use the second attempt only after targeted fixes.

## 26 November 2026 — first-attempt form prepared as-is (Codex)

User chose the current release, demo and existing LinkedIn post. Do not edit the post or add an image as part of this attempt. Codex filled all seven fields in signed-in Chrome for Challenge 6, using the existing public repository, live app, unlisted video, existing LinkedIn post, 781-character changes and 716-character GenAI answers. All values matched and Submit was enabled. The counter showed 0/3 and the deadline displayed 29 November 2026 at 23:59 IST. The form was left open for the user's final Submit action. No attempt consumed by Codex.

The portal says AI evaluates the code against six criteria. It still marks the deployment, video and LinkedIn fields required. The organizer's build-photo guidance remains a separate consideration. No code, deployment, post or server process changed.

Next three tasks: user reviews and presses Submit; record the resulting attempt count and feedback; make targeted fixes only if the feedback warrants another attempt.

## 26 November 2026 — attempt one score verified (Codex)

The user supplied the score screenshot. Signed-in Hack2skill verified 1/3 attempts used, attempt 1 score 95.72/100 and current displayed rank #465 / 56,543. Category scores: Code Quality 86, Security 98, Efficiency 100, Testing 96, Accessibility 99, Problem Statement Alignment 99. Rank is a point-in-time dashboard value. The attempt and Code Quality controls exposed no written evaluator findings. The feedback panel asks the entrant to rate the evaluation. It does not diagnose the score.

Submitted baseline: 8f9c8a5 (per Claude Code's submission record). Codex inspected the source without changing it. Existing Ruff checks pass. A separate C90 check found complexity 29 in app/rules.py filter_eligible_actions, 18 in app/providers.py _parse_response and 11 in app/security.py RequestGuards.__call__. app/static/app.js is 856 lines and owns state, requests and rendering. These are independent maintainability findings, not known reasons for the score. Prioritize the rules and provider complexity before considering a frontend split, and preserve the existing behavior with regression tests. No new submission, push, app edit or server process.

Next three tasks: choose a narrow maintainability pass based on verified findings, run the full regression suite and verify a candidate live, and decide whether to spend attempt two. Preserve attempt three. Submission closes 29 November 2026 at 23:59 IST.

## 26 November 2026 — code quality pass in progress (Codex)

Active editor: Codex. User asked to implement consistent style, smaller functions, careful state/error handling, tests and static checks. Preserve submitted baseline 8f9c8a5 and compare behavior before release. No score beyond attempt one is known. Current priorities are eligibility, provider parsing, request guards, and frontend responsibilities. Next three tasks: refactor and add focused regressions, enable enforceable styling and static checks in CI, then run and review the candidate. No server started.

## 26 November 2026 — code quality candidate passed locally (Codex)

Active editor: Codex. Refactored eligibility, CAMS parsing, request buffering and planner/HTTP interfaces. Split frontend into controller, JSON requests, profile form, views and safe DOM helpers. Handled malformed unit/coordinate metadata, stale plan responses, expired comparisons and bounded streamed bodies explicitly. Comparison changes now follow plan order. No changes to catalogue, provider selection, deployment settings or the Gemini request's data fields.

CI now enforces Ruff naming, bug and complexity rules, mypy, ESLint and Prettier in addition to tests. Local checks passed: 64 backend tests with 88% combined statement/branch coverage, two Node unit tests, six Chromium tests including the desktop and mobile axe checks. A separate 896-combination check matched the submitted eligibility order. Source pattern scanner found zero high/critical findings and the same retry-jitter medium flag. Fixture port 8019 was managed by Playwright. Production runtime dependencies unchanged. README, DESIGN and the attempt-two changes draft are current.

Next three tasks: stage and publish the verified candidate to master, confirm CI and Render/live AI and check the public repository size, then review whether to spend attempt two. No attempt consumed in this pass.

## 26 November 2026 — code quality release live (Codex)

Active editor: Codex completed this pass. Commit f10d5d6d4aa1b5e4d4a2da676afd57676e302961 is on GitHub master. README.md now documents the style rules, code layout, every refactor area and the verification path for the next editor. The packed Git history reachable from master was 402,092 bytes, under the 10 MB limit. Local media stays outside Git.

GitHub CI passed for this exact commit: https://github.com/mohammed-tousif/Saans/actions/runs/45865377825. Local checks recorded 64 backend tests, 88% combined statement/branch coverage, two Node unit tests, six Chromium tests, Ruff, mypy, ESLint and Prettier. The candidate preserved action IDs and their ordering across 896 eligibility combinations compared with 8f9c8a5. Fixture server port 8019 was started and stopped by Playwright. No production settings changed.

Render at https://saans-wwwc.onrender.com served all five module files byte-for-byte from this commit and the homepage used the module entry point with the existing strict CSP. Live planning and comparison returned Gemini 3.5 Flash-Lite AI results using live CAMS data. Comparison preserved the stored original and 08:00–08:45 school drop-off, and excluded public transit and purifier actions after those resources were removed. Full browser flow was tested in CI against fixtures.

Attempt one remains 95.72/100, Code Quality 86, with 1/3 used at the last observed counter. This release has no evaluation score yet and no further attempt was made. The 722-character attempt-two changes text in docs/submission-kit.md matches the release. App, demo and LinkedIn links are the same.

Next three tasks: review this candidate and the prepared form text with the user; if they proceed, verify the portal counter and make attempt two with explicit authorization; compare feedback with attempt one and reserve the last attempt for a justified fix. Deadline 29 November 2026 at 23:59 IST.

26 November (Codex): Development records now live in docs/process. The root AGENTS.md remains the entry point. The frontend documentation preserves the f10d5d6 executable syntax trees.

26 November (Codex): Keep one state owner per process, retain the existing admission and freshness boundaries, and use injected monotonic clocks in tests. Keep the broad AI fallback at the SDK and validation boundary.

26 November (Codex): Preserve exact OpenAPI descriptions by excluding the new developer-only docstrings from previously undescribed route and schema definitions. Allow literal expected values in tests while enforcing named comparison values in application code.
