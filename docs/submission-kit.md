# Challenge 06 submission kit

**26 November release status.** The Render app serves live CAMS and Gemini Flash-Lite plans. The public repo, LinkedIn narrative, and unlisted 2:13 demo are linked below. Check the deployed version and final form values before using an attempt.

## Verified requirements — 24 November 2026

Signed-in source: https://hack2skill.com/event/pwvirtual1/dashboard/submissions/6afaaed39be15aea670e2bed
Roadmap: https://hack2skill.com/event/pwvirtual1/dashboard/roadmap
Public brief: https://promptwars.in/promptwarsVirtual.html

Deadline: 29 November 2026, 23:59 IST. Three attempts maximum; none used in our inspection. Public GitHub repo must be below 10 MB. Required fields: challenge selection, public repository URL, deployed URL, demo-video URL, deployed changes, GenAI services and usage, LinkedIn URL. Repository, changes and GenAI fields visibly show 1024-character counters. Video must be accessible through unlisted YouTube or shared Drive. Evaluation lists code quality, security, efficiency, testing, accessibility and problem alignment. Dashboard explicitly allows any AI tool to build/deploy and requires GenAI; this updates the narrower public Antigravity FAQ. Antigravity was used in the existing implementation.

The brief asks for location/lifestyle-tailored routines, indoor-air actions and sustainable alternatives with explanations of impact. Saans supplies qualitative, evidence-linked explanations; it must not invent quantified benefits.

## Draft: changes (review against the actual deployed build)

Saans turns household routines, resources and transport constraints into practical air-quality actions. This build adds source-labelled environmental context, curated evidence links, fixed-commitment preservation, typed what-if comparisons and acceptance of revised plans. Gemini ranks eligible action IDs; application code validates the selection and supplies reviewed explanations. Failure states show honest fallback guidance. Privacy notices, request-size limits, mobile layout and regression coverage have been improved. No measured health benefit or numerical emissions savings is claimed.

## Draft: GenAI usage

Google Gemini ranks up to three eligible action IDs using a reduced household and air-quality summary. The server validates those IDs and attaches explanations and citations from a reviewed catalogue. Live plan creation and comparison passed on Render using Gemini 3.5 Flash-Lite, which handles generation if the configured primary returns a transient error. Antigravity supported the initial build and Codex repaired and verified the implementation.

## Three-minute demo script (official maximum: under four minutes)

0:00 — Introduce the problem: a school-run parent needs practical choices without moving school commitments.
0:20 — Type a fictional Delhi household's inputs live, including budget, transport and fixed routine times; pause so values can be read. Explain data sharing. Do not rely on pre-filled samples.
0:45 — Create a plan using verified live AI. Show the exact reduced prompt and returned action IDs through a privacy-safe demonstration using fictional inputs, with no credentials. Explain which text is curated and which selection is AI-driven. State the actual environmental mode. Never disguise fixture data or fallback as live AI.
1:10 — Expand an action: show the reason, tradeoff and supporting source. Explain that impact is qualitative.
1:40 — Change a material input, compare with the original and accept. Show changed eligible/selected actions, unchanged school times and updated transport. Capture real results; do not force or fabricate model variation.
2:15 — Show My Home and Sources, including model-data resolution and freshness.
2:40 — Enter an invalid routine time to show a readable validation error, then correct it. Explain honest fallback and current limits. End with public repository and app URLs after they exist.

Video acceptance: show all core features, live readable inputs, success and error cases, actual AI input/output and dynamic behavior. Narration is optional. Keep total duration under four minutes; test unlisted YouTube/public Drive link without account access. These requirements were read from the full official video guide on 25 November; see docs/compliance-audit.md.

Verified rehearsal on Render: Delhi, moderate budget, children, purifier, car and public transit, with school drop-off 08:00–08:45. The initial AI run selected source control, public transport and combined errands. Comparison with public transit and purifier off and zero extra spend removed the public transport suggestion and preserved school drop-off. Both responses returned AI mode and the actual Flash-Lite model ID. An end time of 07:45 triggered validation. These are observed results. Record the actual live results in the demo.

## LinkedIn draft — publish only after deployment and review

I am building Saans for PromptWars Challenge 06: a household air-quality planner that connects daily routines with practical, evidence-linked choices.

The main design decision was to keep factual advice in a reviewed catalogue and use Gemini only to rank eligible actions. Users can change a constraint, compare plans and preserve fixed commitments. The app distinguishes environmental forecasts, synthetic demonstrations and unavailable data.

Antigravity helped build the implementation, and Codex supported review, repairs and validation. The process taught me to verify model-generated claims against code, tests and primary sources.

Before publishing, add verified app/repository/demo links and the final live-AI result. Do not publish this instruction paragraph.

Resources-tab requirements: attach a photo of the actual setup/build; include #BuildwithAI #PromptWarsVirtual #Challenge6 and tag the real Google for Developers and Hack2skill accounts. The required submission field is LinkedIn. Include a substantive build narrative to address the public FAQ's blog/article wording; separate-blog requirement remains ambiguous. No social content has been published by this audit.

25 November audit adds a mandatory single-branch rule (remote master only verified), explicit README coverage, video requirements, fairness restrictions and conflicting generic terms. Read [compliance audit](compliance-audit.md) before attempting submission. Portal remains 0/3.

## User-published LinkedIn post — 25 November
https://www.linkedin.com/posts/mohammed-tousif-malekopp-4370792bb_buildwithai-promptwarsvirtual-challenge6-share-7531409733522534401-loH2/
Chrome confirms Global visibility, narrative and hashtags. Organizer handles are plain text; convert to real mentions. Artwork present; actual setup/build image and anonymous link check remain pending. Do not republish draft automatically.


## Final form values for review — 26 November 2026 (Claude Code)

Rechecked signed in through Chrome on 26 Nov: attempts **0/3**, ends **29/11/2026 11:59 PM IST**, same seven fields, and the changes and GenAI fields have 1024-character limits. The final Submit is left to the user.

| Field | Value |
|---|---|
| Challenges | [Challenge 6] Urban Air Quality Assistant |
| Public GitHub Repository Link | https://github.com/mohammed-tousif/Saans |
| Project Deployed Link | https://saans-wwwc.onrender.com |
| Project Demo Video Submission | https://youtu.be/KyVVyveKvt8 (Unlisted; plays signed out, checked 26 Nov) |
| LinkedIn Post | https://www.linkedin.com/posts/mohammed-tousif-malekopp-4370792bb_buildwithai-promptwarsvirtual-challenge6-share-7531409733522534401-loH2/ |

**Describe the changes (781/1024, verified on Render):**

Saans turns a household's city, routines, budget, transport and resources into practical air-quality actions. Live Open-Meteo CAMS readings include source, index and time labels. Gemini ranks eligible action IDs. Saans validates the IDs and shows reviewed advice, trade-offs and citations. Users can compare a revised plan with the stored baseline and preserve fixed commitments. The app shows validation errors and labels fallback results. The release uses strict CSP, safe DOM rendering, a backup-model circuit breaker and a 10-minute air-data cache. Tests include 51 backend checks, 2 frontend unit checks and 4 Chromium checks. The backend suite reports 82% coverage and axe-core reports zero violations for the tested desktop and mobile states. Impact guidance is qualitative.

**Gen AI services and where used (716/1024):**

Google Gemini API (gemini-3.5-flash-lite serving; gemini-3.8-flash is tried first, Flash-Lite answers if it returns a transient error). Where: app/planner.py. Gemini receives a reduced household summary (city, budget, resources, needs, transport, flexibility, routine count), an air-quality summary and the eligible reviewed actions, and returns up to three action IDs as schema-constrained JSON. Saans validates the IDs and renders advice and citations from its reviewed catalogue, so the model never writes factual claims. Routine names, times and notes are not sent. Build tools: Google Antigravity (initial build), Codex (repairs, verification, deployment) and Claude Code (live verification and demo recording).

### Demo video — recorded 26 Nov

`output/demo/saans-demo.webm`: 2:13 (133.3 s), 1280x720, about 7.7 MB, captioned, no narration. Recorded by Claude Code with Playwright driving Chrome against the live Render app (warmed first). Sequence: live typed fictional Delhi NCR household, with school drop-off 08:00 to 08:45, walk + transit, budget under Rs 500, purifier, children, and then:
- live AI plan in 10.6 s, with the badge showing AI selection and gemini-3.5-flash-lite
- source-labelled CAMS European AQI with its timestamp
- expanded action showing reviewed advice and citations
- drop-off kept in the timeline
- overlay of the actual Gemini system instruction, input JSON and output `{"action_ids": ["ACT001","ACT003","ACT004"]}`, captured locally from app/planner.py with the same fictional profile (primary 3.8 Flash returned ServerError after 8.9 s; Flash-Lite answered in 1.4 s)
- "Metro unavailable" comparison in 12.6 s: added "Combine planned errands", removed "Consider available public transport", school drop-off preserved; accepted
- end time 07:30 before the 08:00 start, rejected with a readable message

The overlay content is a local capture, not the live request, and the video says so on screen. Stills: output/demo/saans-live-plan.png and output/demo/saans-live-compare.png. Raw exchange: output/demo/gemini-exchange.json. Step log: output/demo/recording-log.json.

### LinkedIn post check — 26 Nov

Opened signed out: the content is readable behind LinkedIn's sign-in prompt. #BuildwithAI #PromptWarsVirtual #Challenge6 are present. **Google for Developers** (linkedin.com/showcase/googledevelopers) and **Hack2skill** (linkedin.com/company/hack2skill) are now real clickable mentions. There is exactly one image, the generated PromptWars artwork; **no real app screenshot or build photo.** The text is also stale ("32 tests", "live deployment and AI verification are still underway").

Suggested edit by the user, replacing the sentence that starts "The current automated suite passes 32 tests":
> The live app is now running on Render with real Gemini 3.5 Flash-Lite plans and live CAMS air data, and all 38 automated tests pass. Try it: https://saans-wwwc.onrender.com · Code: https://github.com/mohammed-tousif/Saans

Image to add alongside the artwork: output/demo/saans-live-plan.png (a real screenshot of the live plan: Delhi NCR, European AQI 85, Open-Meteo CAMS, gemini-3.5-flash-lite).


## 26 November 2026 — LinkedIn post edited (Claude Code)
With the user's explicit approval, Claude Code edited the existing post in the user's signed-in Chrome. Only the outdated paragraph changed: it now says Saans is live on Render with real Gemini 3.5 Flash-Lite plans and live CAMS air data, that all 38 tests pass, and links the app, the demo video (https://youtu.be/KyVVyveKvt8) and the repo. LinkedIn shows these as lnkd.in short links. After reloading, the signed-in view showed the new text, the Google for Developers and Hack2skill company mentions still linked, all three hashtags, and the artwork. The post URL is unchanged. The signed-out public page still served the old cached text immediately after saving; recheck it later. LinkedIn's edit dialog cannot add images, so the real screenshot is NOT on the post. Options: add it as a comment with a photo, or make a new post (which needs a new form link). Remaining user action: review the form values in docs/submission-kit.md and press Submit (0/3 attempts, closes 29 Nov 23:59 IST).


## 26 November 2026 — attempt 1 submitted (Claude Code)
The user's own words asked for any corrections and then submission. Before submitting, Claude Code checked that commit 8f9c8a5 (Codex: HTML rendering sinks removed, browser tests added) is on origin master and live on Render. CI passed and its log confirms 51 backend tests, 2 Node unit tests, 82% backend coverage and 4 Chromium tests. The form was blank (0/3). Claude Code filled all seven fields with the user's supplied values in the signed-in Chrome and read them back: every value matched exactly, changes 781/1024, GenAI 641/1024, LinkedIn post unchanged. No corrections were needed. Submit opened a dialog requiring agreement to a plagiarism check (disqualification if plagiarism is found). Claude Code paused, and the user explicitly said "Yes, agree and submit". Claude Code ticked the box and submitted. The portal showed "Submission submitted successfully!" (attempt 1), and the counter is now **1/3** with Attempt 1 Analyzing. The rank shown before submitting was #716/56290 (it doesn't yet reflect this attempt). Next three tasks: read the attempt 1 score and AI feedback once analysis finishes; fix exactly what the feedback names, with tests, and redeploy; use attempt 2 only after the fixes are verified live, and keep attempt 3 in reserve (closes 29 Nov 23:59 IST).


## Attempt two candidate changes (722/1024)

Verified on Render at commit f10d5d6. GitHub CI passed. Keep the existing app, repository, video and LinkedIn field links. The same Google Gemini services and data-sharing scope apply.

Saans builds practical indoor-air and transport plans around a household's city, budget, resources and fixed commitments. Live CAMS model data is source-labelled. Gemini ranks eligible action IDs and Saans validates them before showing reviewed advice and citations. Since attempt one, we separated eligibility, provider parsing, HTTP state and frontend responsibilities. Malformed pollutant units no longer discard valid readings. Stale plan responses and expired comparisons are handled safely. Ruff, mypy, ESLint and Prettier now check the project in CI with 64 backend tests, 88% backend coverage, two frontend unit tests and six Chromium tests. The eligibility order matched attempt one across 896 input combinations.


## 26 November 2026 — attempt 2 submitted (Claude Code)
The user explicitly said "Yes, submit attempt 2". Before submitting, the counter showed 1/3 and Attempt 1 at 95.72, and the form was pre-filled with the attempt 1 values. Claude Code replaced only the changes field with the prepared attempt-2 text (722/1024) and kept the GenAI text (641/1024) and all links. A JavaScript read-back showed all seven values exactly matching. The confirmation dialog repeated the plagiarism-check agreement (the same terms the user approved for attempt 1); Claude Code ticked it as part of the requested submission and submitted. The portal showed "Submission submitted successfully!" (attempt 2), and the counter is now **2/3** with Attempt 2 evaluating. Code at submission: f10d5d6 (live, CI passing). One attempt remains.
Next three tasks: read the attempt 2 score and compare it with attempt 1 per criterion (Code Quality 86 was the target); decide with the user whether a justified fix merits the last attempt; if so, fix, verify live and submit before 29 Nov 23:59 IST.

## Attempt three candidate changes (775/1024)

Verified on Render at `821cdc3`. [GitHub Actions passed](https://github.com/mohammed-tousif/Saans/actions/runs/45870090463). Copy the paragraph below into “Describe the changes/updates made in the deployed version”. Keep the GenAI field text and existing links.

This release keeps Saans's planning flow and advice intact. It moves development records out of the repository root and documents the Python interfaces and five browser modules. The planning limiter, comparison snapshots, live air cache and Gemini circuit breaker now have separate typed owners, with tests for admission, expiry, eviction and recovery. Ruff enforces Google-style docstrings and named comparison thresholds in application code. The ordered eligible actions matched the previous release in all 8,192 household and air-data cases. The OpenAPI schema, content security policy and executable browser code also matched. The suite passes 73 backend tests with 90% coverage, two frontend unit tests and six Chromium tests, including desktop and mobile accessibility.
