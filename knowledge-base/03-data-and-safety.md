# Data, domain knowledge, and impact

## Provider decision

Use an adapter interface so the product does not depend on one vendor’s response format. Select the first production provider only after a live spike proves coverage, field semantics, availability, and terms.

| Candidate | Appropriate role | Limitation / decision gate |
|---|---|---|
| CPCB via data.gov.in | Indian station observations | Confirm units, averaging, timestamps, pagination, API access and reuse terms; do not infer semantics from field names |
| Open-Meteo / CAMS | Regional pollutant forecasts | Model output, not nearby sensor measurement; no street-level routing |
| Google Air Quality API | Alternative environmental provider with Indian index support | Billing, attribution, caching and derived-content terms require implementation-specific review |

The [OGD catalogue](https://www.data.gov.in/catalog/real-time-air-quality-index) exposes station-level data and explicitly warns that automated live values can contain errors. We have not made an authenticated API request or validated its current response schema.

[Open-Meteo documentation](https://open-meteo.com/en/docs/air-quality-api) describes CAMS global forecasts at roughly 45 km resolution and exposes US/European AQI variables. For an Indian location, show pollutant forecasts separately from any Indian AQI observation. Attribute Open-Meteo and the relevant CAMS product. Its [terms](https://open-meteo.com/en/terms) restrict the free endpoint to non-commercial use and impose quotas; assess whether the public competition project qualifies before relying on it. No provider is assumed free forever.

[Google coverage](https://developers.google.com/maps/documentation/air-quality/coverage) lists India with `ind_cpcb`. A returned index using that scale is not automatically a direct CPCB station observation. The [policies](https://developers.google.com/maps/documentation/air-quality/policies) restrict caching and derived uses and specify attribution. Do not automatically send that content into a model or persist it for a retrieval corpus; resolve applicable terms first. Google remains optional in the initial data design; Gemini is a separate service choice.

## AQI correctness

[CPCB’s AQI report](https://www.airquality.cpcb.gov.in/ccr_docs/FINAL-REPORT_AQI_.pdf) describes six categories and requires adequate pollutant coverage, including PM2.5 or PM10. Search-indexed official material was available; full method extraction and implementation verification remain a build prerequisite.

Proposed rules:

1. Every index carries `index_system`; never render an unqualified “AQI.”
2. Never relabel a US AQI or universal index as Indian AQI.
3. Prefer a trustworthy supplied Indian AQI with known provenance to a hurried custom calculation.
4. If calculating an index, implement documented averaging, completeness, units, pollutant requirements, rounding and breakpoints. Test boundaries against authoritative examples.
5. If only a particulate sub-index can be computed, label it as a sub-index; do not call it the complete AQI.
6. Missing or invalid data remains null/unavailable. Zero is a real value, not an error substitute.
7. Do not blend station observations and forecast cells into an unexplained composite number.
8. Do not average AQI values to estimate personal dose or a city’s official index.

## Normalized environmental record

```text
provider, source_url, source_kind [observation|model|fixture]
location_label, coordinates, station_id?, station_distance_km?
spatial_resolution_km?, observed_at?, retrieved_at, valid_at?
timezone, index_system?, index_value?, category?
pollutants[{name, value, unit, averaging_period, completeness?}]
quality_flags[], stale, attribution, provider_version?
```

Retain UTC internally and show Asia/Kolkata for Indian schedules. “Retrieved now” must not hide an old observation. A proposed initial freshness threshold for hourly observations is two hours; validate this against provider cadence and treat it as an application policy, not a health threshold. Forecast age and forecast validity require separate checks.

## Runtime knowledge base

Start with 15–25 manually reviewed action records in versioned JSON. Filter by action type, source, constraints, and applicability. At this scale a vector database adds little value. Expand retrieval infrastructure only when measured retrieval failures justify it.

Each record contains:

```text
id, title, purpose [exposure|emissions|both], eligible_conditions
contraindications, required_resources, budget_band, time_required
approved_explanation, evidence_ids, limitations, reviewed_at, version
```

Seed themes: reduce indoor pollution sources; suitable filtration; ventilation only with relevant context; flexible activity timing/location; feasible shared/public transport; avoid unnecessary idling; consolidate trips; affordable home routines. Each theme needs a reviewed source record before becoming runtime advice.

## Health evidence and constraints

[WHO](https://www.who.int/news-room/questions-and-answers/item/air-pollution-personal-interventions-and-risk-communication) discusses adapting activity timing/location and individual circumstances, including heightened caution for susceptible populations. This supports contextual guidance rather than universal restrictions on all physical activity.

[EPA](https://www.epa.gov/indoor-air-quality-iaq/air-cleaners-and-air-filters-home) prioritizes source reduction, ventilation with clean outdoor air, and filtration as a supplement; filters do not remove every pollutant. Its [emergency indoor-air guidance](https://www.epa.gov/emergencies-iaq/emergencies-and-indoor-air-quality-iaq) also notes tradeoffs involving ventilation, indoor pollutants, and temperature. Wildfire guidance must not be treated as a complete India winter-smog protocol.

Product guardrails derived from these limits:

- Do not prescribe medicine, diagnose symptoms, or provide personalized treatment.
- Do not recommend ozone-generating air cleaners; review device advice against [EPA filtration guidance](https://www.epa.gov/wildfires/indoor-air-filtration).
- Do not suggest plants, fragrance, or steam as substitutes for pollution control.
- Avoid unconditional “close every window all day” rules; account for indoor combustion, heat, and unknown indoor conditions.
- No guarantees of safety, fixed percentage health improvements, or “cigarettes equivalent” claims.
- If a user describes concerning symptoms, leave the routine-planning flow and advise seeking appropriate medical help without attempting diagnosis.
- Have a qualified reviewer assess health-facing advice before wider public use; record any remaining review limitation in the project documentation.

## Impact engine

Keep four outputs separate: pollution emitted, possible exposure changes, money/time, and user-reported action completion.

**Emissions:** `trip_emissions = distance_km × factor_kgCO2e_per_km`. For a vehicle-km factor allocate by occupancy when comparing per-person trips; for a passenger-km factor do not divide again. Savings equals baseline minus alternative, and can be negative. Compare the same scope and trip purpose.

Store factor geography, year, transport class, unit, lifecycle boundary and source. [UK 2026 reporting factors](https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2026) are a possible methodology reference, not validated Indian transport defaults. Until appropriate factors are selected, omit numeric CO2e savings and show qualitative mechanisms. Missing factors must never become zero emissions.

**Exposure:** MVP uses qualitative explanation. If later calculating concentration × time, label it an ambient exposure proxy, with concentration units and duration; it is not inhaled dose or a health-risk reduction. Do not compare route microenvironments using coarse regional forecasts.

**Money/time:** use user-entered or cited assumptions; show estimation status. Do not invent live fares or travel durations.

**Illustrative arithmetic test only:** a fictional 10 km baseline at 0.20 kg/km is 2.0 kg; an alternative at 0.08 kg/passenger-km is 0.8 kg, a 1.2 kg difference at one baseline occupant. These are deliberately synthetic test factors and must never ship as factual defaults.
