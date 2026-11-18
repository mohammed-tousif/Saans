# Product: Saans

All features and priorities below are proposals, not organizer requirements.

## Why someone would use it

An air-quality number does not resolve a household’s day: school drop-off may be fixed, a worker may have no option to stay home, and a purifier may be unaffordable. Saans connects environmental context to feasible actions, shows what is uncertain, and lets the household reject unrealistic suggestions.

Success is a person understanding and choosing a practical action. We are not measuring clinical benefit or claiming an individual can solve citywide pollution.

## Three design personas

| Persona | Constraint | Useful result |
|---|---|---|
| School-run parent | Fixed departure, child, limited extra time | A plan that preserves the school run and offers feasible preparation and indoor alternatives |
| Outdoor worker | Cannot work from home, limited budget | Practical options within available breaks and work conditions; no repeated “stay home” advice |
| Household with older adult | Mobility limits, variable indoor resources | Simple home priorities and a plan that does not depend on outdoor exercise or purchases |

Use fictional profiles during testing. Optional sensitivity flags should improve caution without requiring diagnosis details.

## First-session journey

1. Choose a city manually; offer location permission only as an optional shortcut.
2. Choose routine blocks, available transport, time flexibility, budget band, household needs, and indoor resources. Allow skipping optional questions.
3. Show air context with timestamp, source, index system, and data status.
4. Generate three prioritized actions and a compact day timeline.
5. Expand an action to see why it fits, the evidence, tradeoffs, and what is unknown.
6. Change one constraint: “No purifier,” “Cannot leave later,” or “Metro unavailable.” Replan without losing the rest of the routine.
7. Mark an action as chosen or impractical. Explain that this records a choice, not a measured health outcome.

## Five views

### Today

One-sentence context, last update, top three actions, morning/afternoon/evening plan. Empty, loading, unavailable, and stale states must be designed alongside success. Start with a visible “Create my plan” action; never require chat to discover basic functionality.

### Compare my day

Baseline routine versus proposed routine. Separate time changes, cost estimates, emissions estimates, and qualitative exposure reasoning. Display assumptions next to numbers. “Less pollution exposure” and “less pollution emitted” are different concepts and need separate labels.

### My home

Resource-aware actions ordered by feasibility. Each card includes prerequisites and a limitation. With no indoor sensor, show “Indoor conditions not measured.” User-reported smoke or ventilation issues are inputs, not sensor readings.

### Ask why

A short question interface anchored to the current plan and approved source cards. Useful questions include “Why this option?”, “What if I cannot afford it?”, and “What changed since my last plan?” Answers must not invent local measurements.

### Sources and data

Environmental provider, observation/forecast times, geographical limitations, evidence links, model name, advice version, and estimate assumptions. The main screen should expose a short source badge; detailed provenance belongs here.

## Scope and sequencing

**P0 — finish first:** city input; real data adapter; honest AQI labels; structured routine inputs; curated action records; live AI plan; validation; source explanations; mobile and keyboard usability; clear error handling; deployment and documentation.

**P1 — distinguishing polish:** compare-and-replan interaction; no-cost alternatives; two contrasted household profiles; printable plan; Hindi interface after human language review; feedback reason buttons.

**P2 — only with time:** family member-specific views, offline display of previously saved advice with prominent expiry, optional measured indoor data, community action suggestions.

**Cut:** social feed, account system, complex agent orchestration, hardware build, street-by-street pollution routing, invented forecasts, generic AI image generation, reward marketplace, and continuous background location.

## Interaction rules

- Preserve fixed appointments. If constraints cannot be satisfied, explain the conflict and ask which can change.
- Never equate lower forecast pollution with a guarantee of safety.
- Offer no-cost options before optional purchases.
- Do not let attractive carbon numbers override exposure precautions or mobility constraints.
- State unknown indoor conditions honestly; do not infer an indoor AQI from outdoor readings.
- Make explanations understandable in one or two sentences, with optional detail.
- Use category text and icons in addition to colour. Support reduced motion, readable contrast, meaningful headings, and visible focus.

## Proposed validation with people

Recruit five consenting adults representing at least two personas. Ask them to produce a plan, explain one recommendation, and change a constraint. Record task completion, confusion, and feasibility—not medical details. Target at least four completing the flow without guidance and all five distinguishing a forecast from an observation. These are internal targets, not results already achieved.
