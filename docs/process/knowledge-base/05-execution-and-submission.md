# Execution and first-place strategy

## What a strong entry must prove

There is no verified formula for winning. Our strategy is to make relevance, usefulness and engineering quality easy to observe. Do not optimize for guessed evaluation keywords or claim an official scoring system that has not been published.

The strongest demo moment is a meaningful change: the same city and household receive a revised, feasible plan after a budget or schedule constraint changes. The app explains exactly why the recommendation changed and which evidence supports it.

## Internal review rubric

These weights are our prioritization tool, not official judging weights. Score only completed, demonstrable behavior.

| Area | Internal weight | Evidence |
|---|---:|---|
| Alignment with all six brief elements | 25 | Requirement-to-feature-to-demo traceability |
| Useful personalization | 20 | Contrasted profiles and revised constraints |
| Data integrity and defensible advice | 20 | Provenance, index correctness, uncertainty, source support |
| Reliability and testing | 15 | Passing scenarios, unavailable states, deployed checks |
| Usability and accessibility | 10 | Mobile, keyboard, readability, user task completion |
| Submission clarity and reproducibility | 10 | README, setup, demo, narrative, evidence |

Hard failures override the total: exposed secrets; mislabelled AQI; fabricated readings; unsupported clinical promises; a broken deployed core flow; or missing mandatory submission components. A beautiful interface cannot compensate for these.

## Working schedule

Dates are proposed local milestones in IST, not a verified event calendar. Check the dashboard immediately and compress this schedule if the actual deadline is earlier. The inferred 29 November date is not a safe submission commitment.

| Date | Deliverable | Exit gate |
|---|---|---|
| Nov 18 | Knowledge base and scope | Current documents saved; open questions visible |
| Nov 19 | Data + GenAI feasibility spike | Real environmental response, semantics checked, schema-valid plan |
| Nov 20 | One complete vertical slice | City → routine → useful plan on mobile |
| Nov 21 | Home advice and evidence | Approved advice records; source IDs resolve |
| Nov 22 | Constraint-aware replanning | Fixed commitments respected; no-cost alternatives |
| Nov 23 | Comparison and impact | Arithmetic tests pass; unsupported estimates omitted |
| Nov 24 | Reliability and accessibility | Provider/model failure, keyboard and mobile checks |
| Nov 25 | User trials and deployment | Feedback resolved; anonymous deployed flow verified |
| Nov 26 | Submission-ready package | Repo, demo, blog, LinkedIn draft, form text prepared |
| Nov 27 onward | Buffer only if deadline allows | Small fixes, no uncontrolled scope expansion |

Maintain a working deployable build after the vertical slice. Freeze new features at least 48 hours before the confirmed deadline. Final submission and public publication should follow explicit user authorization; this planning request has not published anything.

## Work backlog

| ID | Work item | Depends on | Completion evidence |
|---|---|---|---|
| R1 | Capture dashboard rules | Account access | Dated requirements note |
| D1 | Verify provider contract and terms | Provider selection | Redacted real response and schema notes |
| D2 | Normalize data and unavailable states | D1 | Parser tests for missing/stale/malformed records |
| K1 | Curate reviewed action catalogue | Primary health sources | Evidence IDs and applicability notes |
| A1 | Build deterministic rules | K1, schemas | Constraint tests |
| A2 | Gemini structured plan | A1, D2 | Real valid generation and failure path |
| U1 | Onboarding and today view | Schemas | Usable phone-sized flow |
| U2 | Compare/replan interaction | A2, U1 | Before/after demonstration |
| I1 | Impact method | Source-backed factors | Unit tests or explicit qualitative-only state |
| Q1 | Evaluation harness | A2, U2 | Scenario results, defects and fixes |
| Q2 | User review | U2 | Consented task-completion notes |
| O1 | Deployment and operating limits | Q1 | Anonymous live checks, quotas, logs |
| S1 | Submission materials | O1 | Working links and concise technical narrative |

## Cuts if time is short

Cut maps, accounts, multilingual output, automatic notifications, numerical carbon savings, and community features before cutting data provenance, core personalization, error handling, or deployment checks. A qualitative impact explanation is better than an unsupported calculation.

If the data provider is not working after the first spike, switch to a lawful, supported alternative and clearly label model data. If no live provider works, keep fixture mode explicit and treat live integration as an unresolved release blocker—not something to hide in a demo.

## Demo storyboard: approximately three minutes

1. **0:00–0:20 — Problem:** show a household with fixed obligations and limited resources. Explain the decision it needs to make.
2. **0:20–0:45 — Context:** select city and show source, update time, AQI system, and whether data is measured/modelled.
3. **0:45–1:20 — Plan:** show tailored daily actions and one indoor-air recommendation with evidence.
4. **1:20–1:55 — Change:** remove a resource or lock a time window; show a genuinely revised plan.
5. **1:55–2:20 — Impact:** explain the mechanism and assumptions; distinguish emissions from exposure.
6. **2:20–2:40 — Reliability:** show a labelled stale-data or unavailable-model case using an explicit test mode.
7. **2:40–3:00 — Proof:** tests, architecture, actual Antigravity contribution, and public app link.

Never splice a fixture output into a purported live run. Keep a labelled recorded walkthrough as backup; it does not replace a functioning public deployment.

## Submission packet

- README: problem, working link, features, architecture, local setup, environment variables, tests, limitations, attribution and actual Antigravity usage.
- Public source: clean dependency manifest, code, small fixtures, meaningful tests, no API keys or videos in the repository.
- Public deployment: anonymous access to core flow and a non-sensitive sample profile.
- Demo: readable text, clear audio or captions, current application behavior, accessible sharing settings.
- Technical blog: design decisions, provider limitations, GenAI boundaries, test evidence, failures and fixes.
- LinkedIn narrative: problem, project value, real build process, one demonstration, links and limitations. Do not invent users, health benefits, test scores, or awards.
- Form text: concise deployed updates and services used; adapt to actual field limits rather than assuming the older template.

## Evidence log template

For every milestone record date, commit/version, exact command or manual scenario, environment, result, defect, and fix. Distinguish mocked integration tests from live calls. Preserve original failures instead of reporting only a polished final number.

Competition advantage comes from reducing reviewer uncertainty: make the app work on first visit, show why it is useful, and make important claims easy to verify.
