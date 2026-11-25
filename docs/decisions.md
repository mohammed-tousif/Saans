# Decisions

## 18–19 November 2026 — Codex repair pass

1. Canonical shared resume record is HANDOFF.md. Every agent updates it after meaningful chunks; quota readings are not assumed available.
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


24 Nov release pass (Codex): official signed-in Challenge 6 form and deadline verified; see HANDOFF. Model metadata succeeds but live generation still fails safely. Release preparation in progress.


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
