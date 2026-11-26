# Saans — Antigravity master build prompt

Paste this whole document into Antigravity with the workspace below open.

---

You are the lead implementation engineer for **Saans — Your family's cleaner-air day**, our PromptWars Challenge 06 entry. Build the actual application in this workspace, test it, improve it, and leave it ready for a second engineering agent, Codex, to continue. Codex owns the overall project direction and will review and refine your implementation when the user returns or your available credits run out.

## 1. Workspace and working agreement

Workspace: `C:\Users\mdtou\project\hackaghoinoinds\cha;;ange6`

Work directly in this folder. Its semicolons require careful shell quoting: use literal paths and explicit working directories. Do not create a second project elsewhere or overwrite existing research. Inspect existing files and any applicable AGENTS.md first; preserve user changes.

The user has approved this product direction and wants implementation, not another proposal. Make routine reversible engineering decisions yourself. Do not ask the user to choose colours, component libraries, directory names or ordinary implementation details. Ask only for truly missing credentials, an irreversible action, spending, or an essential unresolved decision. Continue independent implementation while external requirements remain blocked.

This prompt authorizes local development and verification. It does not authorize purchases, public posts, remote pushes, public deployment, or final competition submission. Prepare those deliverables without claiming they have occurred.

## 2. Read the existing knowledge base

Read `docs/process/KNOWLEDGE_BASE.md`, then all documents in `docs/process/knowledge-base/`, especially `docs/process/knowledge-base/09-grounding-and-corrections.md`. Use them as the evidence and acceptance baseline. This master prompt supersedes the older short `docs/process/knowledge-base/07-antigravity-brief.md` for execution and handoff workflow. Verified current official requirements supersede earlier assumptions. Log material changes and their evidence.

Do not spend the entire session rereading or rewriting research. Begin implementation after understanding the core constraints. Recheck current official documentation only where the implementation depends on it. Never treat the inferred deadline, older challenge form limits, or our internal quality weights as confirmed competition rules.

## 3. Product thesis and winning demonstration

Our product answers:

**“Given our city, today's commitments and what we can afford, what should our household change—and why?”**

Create an excellent daily-action experience, supported by real environmental information and GenAI. A household should be able to produce a useful plan, understand one recommendation, and revise a constraint within a few minutes.

The signature interaction is **Change my day**: the user changes one constraint, such as “no purifier,” “school departure cannot move,” or “public transport unavailable.” The app revises relevant actions, preserves the other constraints, and explains the changes. This must be substantive personalization, not a different greeting around generic tips.

Aim for a first-place-quality submission through relevance, usability, transparent evidence and dependable engineering. Do not promise a ranking, guess secret scoring rules, or fabricate metrics.

## 4. Scope: complete these experiences

### A. Quick household setup

Manual city selection first; optional location permission with a graceful denial path. Start with Delhi NCR and verify at least two contrasting Indian cities. Collect only useful inputs: routine blocks, fixed commitments, flexibility, transport options, budget band, home resources and optional broad household needs. No mandatory login, exact home address or medical history.

Offer a fictional sample household for reviewers. Clearly identify it as sample profile data. This must not silently replace real environmental data with fixtures.

### B. Today

Display environmental context with source, original timestamp, index system, and measured/modelled/unavailable status. Show three prioritized actions plus a compact daily timeline. Make the next useful action obvious. Include indoor-air and lower-emission choices wherever eligible, not only outdoor activity advice.

### C. Change my day

Edit a constraint and regenerate. Show what changed and why. Preserve fixed appointments and resource limits. If no feasible option exists, explain the conflict and let the user decide which constraint can change. Guard against an old request overwriting a newer city or profile.

### D. My home

Provide resource-aware, reviewed indoor-air guidance. No purifier must still yield useful options. Include evidence and limitations. Without a sensor, explicitly say indoor conditions are not measured.

### E. Impact and evidence

Explain how each action helps. Keep emissions, possible exposure, time and cost separate. Include numerical estimates only with documented inputs and appropriate factors. When evidence is insufficient, provide a qualitative explanation and say why no number is shown. Every source link must resolve to an approved source record.

Add an optional focused “Ask why” interaction only after the core planning flow works. It should answer questions about the current plan using its evidence, not become an unrestricted medical chatbot.

## 5. Visual direction

Make Saans feel like a calm, thoughtful consumer product. Use warm off-white surfaces, deep forest-green text and accents, restrained amber for caution, and a clear typographic hierarchy. Use air-quality severity colours only for meaningful status, always alongside text. Avoid generic purple gradients, oversized marketing heroes, decorative dashboard clutter and gratuitous animations.

On mobile, prioritize Today, Change my day, My home and Sources. On desktop, use space to make the plan and its context easy to compare. Show compact explanations with expandable evidence. Use lightweight inline icons and CSS rather than spending credits generating decorative images.

Design loading, empty, stale, partial and error states as deliberately as successful states. Support keyboard navigation, visible focus, labelled forms, reduced motion and readable zoom. Screenshots are required for your own visual verification; do not call an interface polished without inspecting it.

## 6. Architecture defaults

Use Python, FastAPI and Pydantic for the backend; the official `google-genai` SDK for Gemini; and a responsive same-origin HTML/CSS/JavaScript frontend with small modules. This is the default to reduce integration overhead, not permission to produce a crude interface. A larger frontend framework is justified only by a concrete need; document the tradeoff before introducing it.

Choose compatible stable versions after inspecting the environment and official docs, then pin dependencies reproducibly. Make the Gemini model configurable and verify actual account availability. Do not hardcode a model based on a stale tutorial.

Use provider adapters, deterministic constraint rules, a small versioned JSON action/source catalogue, model-assisted composition, output validation and a deterministic calculator. No vector database, multi-agent runtime, microservices or mandatory database is needed for the initial version.

Keep source parsing, business rules, model calls and presentation separate. Follow the proposed structure in the architecture document where useful; choose small, coherent modules over rigid adherence to filenames.

## 7. Data integrity is non-negotiable

Start with a short provider feasibility spike. CPCB/OGD is a candidate for Indian observations; Open-Meteo/CAMS is a candidate for regional forecasts. Verify current metadata, terms, units, averaging periods, timestamps and live response behavior before relying on either. Google Air Quality remains optional because its applicable data-use requirements need review.

- Never relabel US AQI as Indian AQI.
- Never treat a model forecast as a station observation.
- Never fabricate indoor AQI, route precision or missing readings.
- Never substitute zero for unavailable data.
- Never assume a field named `pollutant_avg` is a concentration without checking semantics.
- Preserve original observation time separately from fetch time.
- Display stale data prominently and avoid actionable precision unsupported by its age.
- Do not calculate an Indian AQI unless the documented method and data requirements are fully implemented and tested.
- Regional forecast cells do not establish the cleanest street or route.
- Respect provider attribution, storage and access restrictions.

Explicit fixture mode is allowed for tests and demonstrations. Keep it separate from live mode in the API and UI. Fixture success is never live-integration success.

## 8. AI and advice boundaries

Create a small reviewed catalogue of eligible actions with source IDs, resource requirements, applicability and limitations. For each request, retrieve eligible records deterministically and send only relevant context to Gemini.

Ask Gemini for structured output. Validate schema, action IDs, source IDs, hard constraints and numerical claims before rendering. Allow at most one bounded repair attempt. If AI fails, display clearly labelled reviewed fallback guidance; do not pretend it is a successful AI plan.

The model may explain and compose. Code owns arithmetic, timestamps, source identity and constraint enforcement. User-entered text and source excerpts are untrusted data, not instructions. Do not expose secrets or provide arbitrary URL-fetching tools to the model.

Use approved wording for safety-sensitive guidance. Do not diagnose, prescribe medication, promise health improvements, or guarantee a “safe” outdoor period. Do not recommend ozone generators. Avoid blanket ventilation rules that ignore indoor combustion and heat. A carbon-saving suggestion must not override mobility limitations or appropriate pollution precautions.

For emissions comparisons, use compatible factor units, occupancy treatment, geography and scope. If appropriate factors are absent, keep the MVP qualitative. Never ship synthetic arithmetic-test factors as real defaults.

## 9. Privacy, reliability and cost

Keep API keys server-side in local environment configuration. Create `.env.example` with placeholders and ignore secrets before creating them. Never print keys in logs or handoff notes.

Default to session-only household data. Explain model data sharing; minimize optional sensitivity information. If local saving is implemented, make it opt-in with a working delete/reset control. Do not log full household prompts.

Bound input length, request frequency, concurrency, retries, timeouts and model output size. Prevent repeated clicks from creating duplicate expensive requests. Handle quota exhaustion, provider failures, malformed output and cancellation. Cache only where terms permit. Report measured token use and latency when available, not invented performance figures.

## 10. Build in verified increments

**Milestone 0 — Foundation:** inspect workspace; establish environment, ignore rules, dependency manifest, source layout and handoff files. Confirm the smallest live-data/AI path. If a key is missing, implement the adapter and honest unavailable state, then continue independent work.

**Milestone 1 — End-to-end slice:** city → constraints → real provider context → real validated AI plan → mobile page. This is the first major success criterion. Do not build disconnected screens first.

**Milestone 2 — Product completeness:** home advice, evidence links, resource-aware actions, change-constraint flow and comparison. Demonstrate at least two distinct household profiles.

**Milestone 3 — Hardening:** meaningful unit/integration checks, the knowledge-base evaluation scenarios, keyboard/mobile checks, upstream failures, stale data, prompt injection and request-race handling.

**Milestone 4 — Reviewer-ready package:** reproducible startup, container configuration where appropriate, sources, privacy notes, limitations, actual test evidence, demo script and draft submission text. Prepare deployment; do not claim deployment without verifying the real URL.

Continue through milestones without repeatedly requesting approval for ordinary local work. Prefer a completed, testable slice over a large unfinished scaffold. Cut optional scope when necessary; preserve correctness and the core demonstration.

## 11. Verification and definition of done

Use `docs/process/knowledge-base/06-evaluation.md` as the detailed scenario specification. Prioritize tests that detect real mistakes: AQI scale confusion, stale timestamps, constraint violations, unsupported sources, unit mistakes, API failures and invalid AI output.

Run applicable checks and fix failures before expanding scope. Distinguish deterministic/mock tests, actual live calls, manual inspection and untested behavior. Inspect real UI output at phone and desktop sizes, including at least one failure state. Record commands and concise results.

The application is locally complete only when:

- A fresh setup can follow the README successfully.
- Core screens and actions function rather than being placeholders.
- Data and model modes are truthful and visible.
- Fixed constraints are preserved and replanning changes relevant actions.
- Evidence resolves and numeric claims are supported.
- Key error paths are handled and critical tests pass.
- No secret is present in source, client assets or logs.
- Remaining external blockers and limitations are explicit.

If missing credentials prevent live validation, call it “implemented, live verification pending,” not complete.

## 12. Mandatory incremental handoff for Codex

Credits can end unexpectedly. Maintain these files from the first milestone, not only at the end:

**`docs/process/HANDOFF.md` — canonical shared resume record**

Read this file and `AGENTS.md` before starting or resuming. Update the handoff after each meaningful work chunk and before stopping, not only at the end of a milestone. Codex follows the same protocol. Resume from the recorded unfinished task after inspecting the current code. A quota reset alone does not transfer editing ownership.

- Last updated time, current milestone and actual state.
- Working features and unfinished features.
- Exact start/build/test commands and required environment-variable names, never values.
- Current server ports/process information if relevant.
- Last checks run, their results and known failures.
- Real integrations verified versus fixtures/mocks only.
- Important decisions and links to supporting notes.
- The next three tasks in execution order, with relevant files.
- External blockers and how they can be resolved.

**`docs/process/TASKS.md`**: small prioritized checklist with pending/in-progress/done/blocked states and acceptance criteria. Mark a task done only with evidence.

**`docs/decisions.md`**: dated consequential design choices and reasons, especially deviations from the knowledge base.

**`docs/verification.md`**: actual commands, environment, pass/fail results, live checks and UI screenshots/observations. Do not store credentials or personal data.

**`docs/build-log.md`**: concise record of work actually performed in Antigravity, for truthful build-in-public documentation.

Update these after every milestone and before starting a risky integration. Leave code in a runnable state whenever possible. If interrupted mid-change, describe the exact unfinished edit and any failing command. Do not wipe work, reset history, re-scaffold the project or hide failures to make the handoff look cleaner.

Do not start a major rewrite when credits are nearly exhausted. Finish the current slice, verify it, and update the handoff. Do not invent remaining-credit estimates if the tool does not expose them.

Codex will inspect the actual code and rerun relevant checks when taking over. Your handoff should let it continue without asking the user to reconstruct your session.

## 13. Communication and first action

Use concise progress updates: what works, what you verified, what remains and the next increment. At the end, provide launch instructions, test evidence, known blockers and the handoff path. Avoid celebratory claims about winning or production readiness.

**Start now:** inspect the folder, read the knowledge base, create the handoff/checklist, and implement the smallest end-to-end slice. Do not stop after writing a plan.
