# Challenge 06 submission kit

## Verified requirements — 24 November 2026

Signed-in source: https://hack2skill.com/event/pwvirtual1/dashboard/submissions/6afaaed39be15aea670e2bed
Roadmap: https://hack2skill.com/event/pwvirtual1/dashboard/roadmap
Public brief: https://promptwars.in/promptwarsVirtual.html

Deadline: 29 November 2026, 23:59 IST. Three attempts maximum; none used in our inspection. Public GitHub repo must be below 10 MB. Required fields: challenge selection, public repository URL, deployed URL, demo-video URL, deployed changes, GenAI services and usage, LinkedIn URL. Repository, changes and GenAI fields visibly show 1024-character counters. Video must be accessible through unlisted YouTube or shared Drive. Evaluation lists code quality, security, efficiency, testing, accessibility and problem alignment. Dashboard explicitly allows any AI tool to build/deploy and requires GenAI; this updates the narrower public Antigravity FAQ. Antigravity was used in the existing implementation.

The brief asks for location/lifestyle-tailored routines, indoor-air actions and sustainable alternatives with explanations of impact. Saans supplies qualitative, evidence-linked explanations; it must not invent quantified benefits.

## Draft: changes (review against the actual deployed build)

Saans turns household routines, resources and transport constraints into practical air-quality actions. This build adds source-labelled environmental context, curated evidence links, fixed-commitment preservation, typed what-if comparisons and acceptance of revised plans. Gemini ranks eligible action IDs; application code validates the selection and supplies reviewed explanations. Failure states show honest fallback guidance. Privacy notices, request-size limits, mobile layout and regression coverage have been improved. No measured health benefit or numerical emissions savings is claimed.

## Draft: GenAI usage

Google Gemini is integrated server-side to rank up to three eligible action IDs using a reduced household and environmental summary. Its output is validated against a closed catalogue; factual advice and citations are supplied by application code. Antigravity supported the initial implementation and follow-up changes; Codex reviewed and repaired the application and prepared verification and release records. Before submitting, confirm successful live Gemini generation on the deployed instance. Current local generation attempts return upstream errors, so this draft must not imply live AI success yet.

## Three-minute demo script (proposed duration, not an official limit)

0:00 — Introduce the problem: a school-run parent needs practical choices without moving school commitments.
0:20 — Load the fictional Delhi parent, show budget, transport and mobility options; explain data sharing.
0:45 — Create a plan. State the actual displayed AI/fallback and environmental mode. Never disguise fixture data as live.
1:10 — Expand an action: show the reason, tradeoff and supporting source. Explain that impact is qualitative.
1:40 — Toggle transit availability, compare with the original and accept. Show unchanged school times and updated transport.
2:15 — Show My Home and Sources, including model-data resolution and freshness.
2:40 — Explain constrained AI, honest fallback and current limits. End with public repository and app URLs after they exist.

## LinkedIn draft — publish only after deployment and review

I am building Saans for PromptWars Challenge 06: a household air-quality planner that connects daily routines with practical, evidence-linked choices.

The main design decision was to keep factual advice in a reviewed catalogue and use Gemini only to rank eligible actions. Users can change a constraint, compare plans and preserve fixed commitments. The app distinguishes environmental forecasts, synthetic demonstrations and unavailable data.

Antigravity helped build the implementation, and Codex supported review, repairs and validation. The process taught me to verify model-generated claims against code, tests and primary sources.

Before publishing, add verified app/repository/demo links and the final live-AI result. Do not publish this instruction paragraph.
