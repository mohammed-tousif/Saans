# Challenge 06 compliance audit

**25 November follow-up.** Render now serves live CAMS data and passed real Gemini Flash-Lite plan creation, constraint comparison, and invalid-schedule validation. The user published the LinkedIn narrative. The video and final link review remain. The original audit below records the earlier state and its rule sources.

Checked 25 November 2026 by Codex using the user's signed-in Chrome and current source at 40dc19e. Verdict: **aligned in concept, NOT ready for the first attempt**. No attempt consumed; portal showed 0/3. This is an evidence review, not an organizer eligibility decision or predicted score.

## Official sources read

- [Challenge and expanded brief](https://hack2skill.com/event/pwvirtual1/dashboard/challenges).
- [Submission form and full Instructions dialog](https://hack2skill.com/event/pwvirtual1/dashboard/submissions/6afaaed39be15aea670e2bed).
- [Linked submission guide](https://docs.google.com/document/d/1yw0RLAkfp5TBYajwMRHaxZFc6zOgElKkj2Z-B9HxrWk/edit): read through browser-exported Markdown.
- [Video guide](https://docs.google.com/document/d/e/2PACX-1vROmkFEAtFJ5k7PIl4H-B5AFDf2-vv6wLPRsuKnDSprJO30kvB7p-oarZdNZQhsF5srNQ0KAKCP6RBm/pub): all six sections and final checklist.
- [Resources](https://hack2skill.com/event/pwvirtual1/dashboard/resources) and [Announcements](https://hack2skill.com/event/pwvirtual1/dashboard/announcements): social instructions and dashboard notices. Announcement area had no additional visible entries.
- [Public event page](https://promptwars.in/promptwarsVirtual.html): phases, eligibility, rewards, all six expanded FAQs.
- [Linked general terms](https://hack2skill.com/legacy/tnc): full page including conduct, IP, eligibility and awards. These are generic and contain conflicts noted below.
- [Credits guide](https://docs.google.com/document/d/e/2PACX-1vRvT-PacPZRltgWrXO3ZDRNYAKeZEeH0hfN2GUWAemU2bT27Wjp3jzDnQcCZqOKJE3ftXqbG45f-HF4/pub): reward tables, bonuses, expiry conditions; internally inconsistent.

## Submission requirements and evidence

| Requirement | Current evidence / action |
|---|---|
| Deadline | 29 November 2026, 23:59 IST; opening 16 November, 16:00 IST. Use explicit portal deadline, not generic Day 13 prose. |
| Maximum three attempts | 0/3 shown. Preserve attempts until release gates pass. |
| Public GitHub, complete source, below 10 MB | GitHub visibly marks Saans Public. Source tree about 650 KB; git object storage 412 KiB. Recheck final archive/history before submission; organizer does not specify exact size measurement. |
| Only one branch | Actual remote `git ls-remote --heads origin` returns only master at 40dc19e. Keep all work on this branch for this challenge. |
| README | Must explain vertical, approach/logic, operation and assumptions. Explicit sections added in this audit. |
| Required form fields | Challenge selection, repository, deployed URL, demo video, deployed changes, GenAI usage, LinkedIn post. Repository/changes/GenAI have 1024-character counters; URLs require http(s). |
| GenAI mandatory | Integration exists; last actual generation failed upstream. Mocked tests/fallback do not meet proof of working AI. BLOCKED until successful real generation is demonstrated. |
| Live preview | Render creation was attempted earlier, but no final URL/build status verified. Inspect existing service; do not create duplicates. |
| Video | Under four minutes; accessible unlisted YouTube or public-link Drive. Type inputs live and visibly; show success AND edge/error cases. Show actual AI prompt and response, explain purpose, demonstrate changing inputs cause dynamic behavior. No sample-only or saved-result substitute. Narration optional; readable captions acceptable. Test link without special access. |
| Social narrative | Resources request photo of setup/build, brief idea, #BuildwithAI #PromptWarsVirtual #Challenge6 and tags @googlefordevelopers @hack2skill. Use actual LinkedIn account mentions. Required form is LinkedIn; Instagram guide does not replace that field. Publish only with user instruction. |
| AI build workflow | AI platform, configured Git/account, public repository, prompting/coding, regular commits and single branch. User used Antigravity and Codex. Preserve honest attribution rather than inventing prompt history. |

## Product alignment against the actual brief

The brief calls for a GenAI assistant for families and communities facing winter smog/urban pollution, with location/lifestyle-tailored low-emission routines, indoor-air actions, sustainable alternatives, and clear explanations of impact. It does NOT explicitly require Python, a chatbot, numerical health savings, paid hosting, an Indian AQI calculation, or IoT sensors.

| Brief element | Actual implementation | Gap / acceptance evidence needed |
|---|---|---|
| Families | Household resources, budget, children, mobility and routines; fixed commitments preserved | End-to-end live manual-input demonstration |
| Communities | No dedicated shared/community workflow | Add a useful community-oriented journey or explicitly narrow scope; do not claim multi-household coordination exists |
| Location and pollution | City-based Open-Meteo/CAMS context with source/time/scale and unavailable/stale states | Verify hosted live values; regional model is not street-level or indoor measurement |
| Lifestyle adaptation | Resource/budget/transport eligibility; typed compare and accept | AI receives routine count, not routine timing/location; stronger, privacy-conscious routine relevance is needed for a competitive daily assistant |
| Low-emission routines | Transit, combined errands and parked idling advice | Fallback often repeats the same actions; driving advice can be offered without driving. Improve meaningful relevance and demonstrate contrasting households |
| Indoor actions | Source control and conditional filtration | Only two enabled indoor actions; broaden only with reviewed evidence and applicability tests |
| Sustainable alternatives | Transit/errand choices | Explain the specific replaced choice and tradeoff more clearly |
| Direct impact | Reviewed qualitative reasons and limitations | Some reasons describe an action rather than its causal effect. Add supported action-to-effect explanations; no fabricated health/emissions numbers |
| GenAI assistant | Gemini selects up to three eligible IDs; strict validation | Real AI success and dynamic input/output demonstration still missing. Constrained selection is legitimate AI integration, but not proof of rich personalization |

## Evaluation criteria

Instructions name code quality, security, efficiency, testing, accessibility and problem-statement alignment. They explain high/medium/low impact tiers in general, but do not assign visible weights. All six criterion controls were clicked; no additional visible detail appeared. Do not invent weights or a predicted score.

| Criterion | Evidence | Remaining verification |
|---|---|---|
| Code quality | Separate schemas, provider, rules, planner and UI; locked dependencies | Dead helper/docstring cleanup; readable frontend maintenance |
| Security | Server-only secret, closed action IDs, size/rate limits, safe upstream error handling | Existing scanner has 20 innerHTML-pattern findings, not a clean audit; browser injection checks, dependency/license review and CSP remain |
| Efficiency | Bounded model response, timeout, concurrency and capped snapshots | Hosted cold-start/latency, multi-user behavior and resource use not measured; one-worker limits |
| Testing | Fresh run: 32 passed in 0.47s on 25 Nov | Actual hosted AI/provider and recorded success/error cases; prior browser checks were fixture-only |
| Accessibility | Labels, focus styles, mobile layout and reduced-motion CSS | Full keyboard/screen-reader/contrast review not done; clay mobile labels as small as 8–9px need improvement |
| Alignment | Source-linked household planner with constraint comparison | Community usefulness, depth of personalization and effects explanation as above |

## Rules, conduct and unresolved contradictions

- Event page says India only; invites students, professionals and indie builders. Selection/shortlisting remains organizer discretion. FAQ prohibits plagiarism, cheating and multiple accounts for advantage; prizes can be revoked. No leaderboard manipulation or fabricated evidence.
- Current dashboard and event build phase allow any AI tool; FAQ still says Antigravity required. Actual Antigravity use is already part of this project, so preserve attribution and avoid claiming an exclusive tool requirement was conclusively removed.
- Phase section asks for LinkedIn narrative; FAQ says blog/article. Safest package: a substantive LinkedIn build article/post covering approach, decisions and lessons, plus a repository narrative. Confirm whether a separate blog is required if organizer guidance remains ambiguous.
- Generic linked terms say teams of 2–6, one team per person, checkpoint attendance and a five-minute presentation. The event is presented as individual virtual participation and its specific video guide says under four minutes. **Do not assume the generic team requirement is waived. Ask organizer which eligibility/presentation terms apply.** No need to create a team or change registration without clarification.
- Generic terms cover legal/third-party rights compliance, no confidential or unlicensed content, no malware/misrepresentation, final organizer/judge decisions, rule/prize changes, and possible disqualification. They include broad publicity/marketing permissions, recording permissions, a six-month first-refusal provision for exclusive IP licensing, third-party-rights warranties/indemnity, and minimum age 14 with guardian/waiver provisions for minors. User should review these before final submission. This records the page, not a legal interpretation or acceptance.
- Generic awards section mentions nontransferability, taxes/TDS and cash timing; PromptWars specifically describes reward credits. Do not promise cash. Rank one is listed as 5,000 credits per challenge. Public page describes eight challenges; credits guide references eighteen, says both never-expire and expiry 1 January 2027, and contains inconsistent arithmetic. Confirm rewards/expiry with organizer rather than repeating conflicting promises.
- Public FAQ release day (Friday) differs from phase prose (Monday). Explicit Challenge 6 form dates govern our working schedule; do not infer future dates.

## Order before attempt one

1. Resolve real AI generation and verify the existing Render deployment, including live and fallback paths. Keep secrets private.
2. Strengthen the product gaps above; run focused regressions and keyboard/mobile/injection checks. Keep source-grounded claims.
3. Record a compliant <4-minute real walkthrough, publish the approved narrative, verify anonymous links, final branch/size/source checks. Clarify applicable eligibility/terms with organizer. Review exact form values with user before final attempt.

Suggested organizer question (not sent): For PromptWars Virtual Challenge 6, please confirm whether solo entries are eligible despite the linked generic 2–6 team rule, whether LinkedIn narrative alone satisfies the blog/article FAQ, and which event-specific terms supersede generic presentation/IP provisions. Please also confirm the current reward-credit expiry and challenge count.

## Later same-day verification
User confirms solo participation valid. Hosted service now verified live at https://saans-wwwc.onrender.com, commit 40dc19e; actual model air data renders. AI still returns ServerError and labelled fallback. Deployment gate partially cleared; real AI gate remains. See the latest [handoff checkpoint](process/HANDOFF.md).
