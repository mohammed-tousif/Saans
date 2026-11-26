# PromptWars 06 — project knowledge base

Research baseline: 18 November 2026, Asia/Kolkata. Status updated 24 November: a local application is implemented; see the [handoff](HANDOFF.md) and [verification record](../verification.md) for current checks, deployment and submission status.

## Recommendation

Build **Saans — Your family's cleaner-air day**, a mobile-first assistant that turns local air information and everyday constraints into an achievable daily plan. The name is a working title; availability and trademark checks have not been performed.

The central question is: **“Given where we live, what we must do today, and what we can afford, what should we change—and why?”**

Use a Python backend, a small responsive web interface, Gemini for grounded explanations and personalized plans, and explicit deterministic rules for data quality, constraints, and arithmetic. Python is our proposed implementation choice; this is not established as a Python-only competition.

## Read in this order

For implementation, use the [Antigravity master prompt](ANTIGRAVITY_MASTER_PROMPT.md). It adds the approved execution workflow and incremental Codex handoff requirements to this research baseline.

1. [Evidence and challenge requirements](knowledge-base/01-evidence-and-requirements.md): what is confirmed, what is uncertain, and what must be checked.
2. [Product and user experience](knowledge-base/02-product.md): purpose, users, screens, scope, and the distinguishing interaction.
3. [Data, knowledge, and safety](knowledge-base/03-data-and-safety.md): providers, AQI correctness, advice records, and impact calculations.
4. [Architecture and project setup](knowledge-base/04-architecture.md): Python design, contracts, request lifecycle, and setup sequence.
5. [Execution and first-place strategy](knowledge-base/05-execution-and-submission.md): milestones, release gates, demo, and competition evidence.
6. [Evaluation cases](knowledge-base/06-evaluation.md): repeatable scenarios and acceptance criteria.
7. [Antigravity implementation brief](knowledge-base/07-antigravity-brief.md): a ready-to-use starting prompt.
8. [Source register](knowledge-base/08-sources.md): links, evidence quality, and refresh triggers.

## The five answers

| Question | Decision |
|---|---|
| How do we create it? | First prove the data and one end-to-end planning flow; then add household constraints, comparison, evidence, and tests. Build through Antigravity and document actual usage. |
| What is it for? | Helping households choose practical routines during polluted periods while reducing their own emissions where feasible. |
| How does everything work? | Location and routine → validated environmental context → eligible action catalogue → constrained AI plan → validation → explanation and comparison → user feedback. |
| How do we compete for first? | Make one useful journey exceptional; demonstrate source transparency, meaningful personalization, robust failures, and measurable validation. Ranking is outside our control. |
| How do we win this challenge? | Align every core feature to the brief, finish early, provide a dependable public app, and submit evidence that reviewers can reproduce. Avoid speculative leaderboard tricks. |

## Scope decisions

- Initial audience: Indian urban households, with Delhi NCR as the first test region and at least two contrasting cities for coverage testing.
- First version: no required login, no exact address, no medical record collection, no paid hardware dependency.
- Primary experience: today’s actionable plan; supporting views: air context, home actions, compare changes, and sources.
- Distinguishing feature: revise the plan when a real constraint changes, and explain the tradeoff.
- Evidence is a product feature: every environmental reading has source, time, scale, and measurement/model status.
- No invented health percentages, fake live data, indoor sensor readings, or street-level precision.
- Official deadline is 29 November 2026 at 23:59 IST. Full verified requirements and unresolved source conflicts are recorded in docs/compliance-audit.md (25 November).

## Next concrete milestone

Complete a one-day feasibility spike: obtain one real provider response, verify its semantics and timestamp, generate one schema-valid Gemini plan from curated evidence, and render it on a phone-sized screen. Do not spend the first day on a logo, map animation, or login.

## Maintenance

Keep verified facts in document 01 and sources in document 08. Record design changes with date and reason. Treat all dates, pricing, quotas, model availability, and event rules as refreshable. This knowledge base is saved in the project workspace; it is not a claim of permanent assistant memory.

## Implementation correction register

Read [Grounding and corrections](knowledge-base/09-grounding-and-corrections.md) before resuming implementation. The current build uses constrained AI selection and curated explanations; this supersedes unrestricted plan-generation suggestions in the original blueprint.
