# Antigravity implementation brief

The expanded [master build prompt](../ANTIGRAVITY_MASTER_PROMPT.md) supersedes this short brief for execution and handoff. Use the master prompt for the initial Antigravity build in this folder.

Paste the following into Google Antigravity after opening the project folder. This is a build brief, not evidence that Antigravity has already been used.

---

Build Saans, a mobile-first Urban Air Quality Assistant for PromptWars Challenge 06. First read KNOWLEDGE_BASE.md and all linked knowledge-base documents. Treat proposed features as design decisions and unresolved rules as unresolved; never fabricate organizer requirements.

The product helps Indian households turn local environmental information, routines, budget, available transport and indoor resources into practical daily actions. The core demonstration is a plan that changes meaningfully when the user changes a constraint.

Use Python/FastAPI/Pydantic for the backend and the official Google Gen AI Python SDK for a real Gemini integration. Start with a simple same-origin responsive interface. Inspect the actual environment and current official SDK documentation before choosing compatible package versions and an available model. Keep the model configurable.

Begin with a short feasibility spike: verify one real data-provider response, its units/timestamps/meaning, applicable terms and provenance; generate one real structured plan; render it in a minimal page. Report blockers precisely. Do not spend this phase on branding or optional features.

Implement in vertical slices:

1. Typed schemas, provider abstraction, truthful environmental display and unavailable states.
2. Routine input, curated action records, deterministic constraint checks and a real Gemini plan.
3. Source-supported explanations and household/home recommendations.
4. Change-constraint interaction and before/after comparison.
5. Impact arithmetic only with documented factors; otherwise qualitative mechanisms.
6. Evaluation scenarios, accessibility, deployment preparation and reviewer documentation.

Keep factual computation outside the language model. The model may compose explanations from eligible action records but may not invent readings, citations, prices, AQI values, emission factors or clinical outcomes. Validate schema, evidence IDs, constraints and numerical claims before rendering. One bounded repair attempt is acceptable; label rule-based fallback honestly.

Air-data requirements: explicit index system; separate observations and model forecasts; original timestamps; source and spatial limitations; no missing-to-zero conversions; no unsupported Indian AQI calculations; no indoor readings inferred from outdoor data. Coarse regional forecasts cannot support a street-level clean-route claim.

Privacy and operations: no required account, exact address, or medical history. Keep secrets server-side. Explain model data sharing. Make optional local persistence clear and deletable. Bound requests, retries, token use and concurrency. Do not commit keys, virtual environments, large assets or personal logs.

Use the evaluation document as the acceptance specification. Write meaningful tests for the rules, provider parsing, model failure behavior and arithmetic. Keep synthetic fixtures visibly synthetic. Separately record live smoke tests and measured performance. Do not claim a test passes without running it.

Make the interface readable, keyboard accessible and usable on phones. Today’s actions should be obvious without opening chat. Every recommendation needs a short reason and a traceable source. Budget-constrained users need realistic options.

Prepare a README, architecture notes, data-method notes, source attribution, environment example, test instructions, limitations and demo script. Record real Antigravity work and decisions. Confirm the live dashboard requirements before final packaging. Do not invent a confirmed deadline.

Work locally until a usable implementation exists. Report milestones with files changed, verified behavior, remaining defects and exact setup requirements. External publication, paid provisioning and final submission must stay within the user’s actual authorization.

---

## Follow-up prompt for each milestone

“Demonstrate the current milestone against its acceptance criteria. Show actual checks and failures. Fix the highest-risk defect before adding scope. Update the decision/evidence log and keep the next increment small enough to verify.”
