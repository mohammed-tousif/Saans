# Source register and refresh policy

Checked 18 November 2026 unless stated otherwise. These are links and concise research notes, not copied source documents. Public documentation review does not imply live API testing or account access.

| ID | Source | Used for / evidence status |
|---|---|---|
| S01 | [PromptWars Virtual](https://promptwars.in/promptwarsVirtual.html) | Primary page read: programme rules and submission wording; dynamic full brief absent from text extraction |
| S02 | [User-supplied Muse guide](https://muse.ai/s/promptwars-challenge-06-sxc6xxtoxmpbxhxe/Ul2h4aavZ67tWkiwU1jaE-Q8pN_L9mc-yxFB_exkRNU) | Secondary guide read through rendered page; brief, inferred dates and prior-challenge template |
| S03 | [OGD air-quality catalogue](https://www.data.gov.in/catalog/real-time-air-quality-index) | Primary indexed catalogue; dataset existence and quality warning, not verified API semantics |
| S04 | [OGD resource](https://www.data.gov.in/resource/real-time-air-quality-index-various-locations) | Primary indexed resource; API setup discovery point |
| S05 | [CPCB AQI report](https://www.airquality.cpcb.gov.in/ccr_docs/FINAL-REPORT_AQI_.pdf) | Primary search-indexed material; detailed algorithm still requires full verification |
| S06 | [CPCB About AQI](https://www.cpcb.nic.in/displaypdf.php?id=bmF0aW9uYWwtYWlyLXF1YWxpdHktaW5kZXgvQWJvdXRfQVFJLnBkZg) | Official search extract found; direct retrieval timed out |
| S07 | [Open-Meteo air-quality docs](https://open-meteo.com/en/docs/air-quality-api) | Primary documentation read; model resolution, exposed variables and attribution |
| S08 | [Open-Meteo terms](https://open-meteo.com/en/terms) | Primary terms read; endpoint access restrictions and quotas |
| S09 | [Google Air Quality coverage](https://developers.google.com/maps/documentation/air-quality/coverage) | Primary documentation read; India index support |
| S10 | [Google Air Quality policies](https://developers.google.com/maps/documentation/air-quality/policies) | Primary documentation read; storage, derived-use and attribution constraints |
| S11 | [WHO personal interventions](https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication) | Primary health guidance; contextual activity recommendations and uncertainty |
| S12 | [EPA home air cleaners](https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home) | Primary guidance read; source control, ventilation and filtration limits |
| S13 | [EPA indoor-air emergencies](https://www.epa.gov/emergencies-iaq/emergencies-and-indoor-air-quality-iaq) | Primary search excerpt; ventilation and indoor-condition tradeoffs |
| S14 | [EPA indoor air filtration](https://www.epa.gov/wildfires/indoor-air-filtration) | Primary search excerpt; filtration and ozone caution; wildfire context |
| S15 | [UK 2026 conversion factors](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2026) | Primary publication; methodology reference only, no Indian factor values adopted |
| S16 | [Google Gen AI Python SDK](https://github.com/googleapis/python-genai) | Official repository documentation queried with Context7; schemas, async calls, validation behavior |
| S17 | [FastAPI request bodies](https://fastapi.tiangolo.com/tutorial/body/) | Official documentation queried with Context7; typed request schemas |
| S18 | [FastAPI testing](https://fastapi.tiangolo.com/tutorial/testing/) | Official documentation queried with Context7; API test setup |

## Refresh triggers

- Before scope lock: dashboard brief, eligibility, deadline, form fields and submission rules.
- Before writing an integration: provider endpoint, schema, licence, quotas, coverage, units and update cadence.
- Before deployment: model availability, pricing, platform charges, privacy/data-use terms and operational limits.
- Before adding numeric estimates: factor geography, vintage, unit and methodology.
- Before public use of health-facing guidance: source applicability and qualified review.
- Before final submission: every public link and required field, tested from a fresh anonymous session.

## Remaining research with highest value

1. Capture the actual Challenge 06 dashboard and any official explainer materials.
2. Validate OGD field semantics using official metadata and a real response, especially whether a field is concentration or index.
3. Select one lawful forecast source and verify it at three Indian locations.
4. Choose and test the available Gemini model using the user’s account; compare useful output, latency and cost rather than model prestige.
5. Find appropriate Indian transport factors or deliberately keep MVP impact qualitative.
6. Review curated advice for Indian housing, climate and resource constraints.

## How to add evidence

For each new factual claim store source ID, URL, owner, publication/update date if available, date checked, exact supported claim, confidence, and limits. Keep product hypotheses separate from source findings. A search snippet is discovery evidence; verify full owning content before using its details in a computation or high-stakes recommendation.

## Decision log

| Date | Decision | Reason |
|---|---|---|
| Nov 18 | Daily household planner as core | Directly connects personalization, routines, indoor actions and explanations |
| Nov 18 | Python backend; small web frontend | Fits requested Python interest while preserving simple deployment |
| Nov 18 | Curated JSON knowledge catalogue first | Small corpus is easier to audit and test than a broad uncontrolled retrieval system |
| Nov 18 | Separate environmental observations from forecasts | Avoids false precision and misleading live-data claims |
| Nov 18 | No numerical carbon defaults yet | Appropriate regional factors and boundaries remain unverified |
| Nov 18 | Prepare technical blog and LinkedIn | Covers both official page variants without relying on the shorter wording |
| Nov 18 | Deployment provider and model deferred | Account, budget and live availability have not been checked |
