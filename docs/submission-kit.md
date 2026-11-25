# Challenge 06 submission kit

**25 November release status.** The public app at https://saans-wwwc.onrender.com is serving live CAMS data and Gemini 3.5 Flash-Lite plans. Published repository: https://github.com/mohammed-tousif/Saans. The user-published LinkedIn URL is below. The demo video and final competition attempt are pending.

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
