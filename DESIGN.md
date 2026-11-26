# Design and trust boundaries

## 18 November 2026 repair decisions

Model output is untrusted. Pydantic permits only a short action-ID list; unknown IDs, duplicates and extra fields fail validation. All visible advice/citations come from enabled source-reviewed records. This reduces unsupported model claims but does not certify medical correctness or ranking quality.

The comparison API accepts an allowlisted typed constraint change and a temporary opaque baseline ID. It checks the profile against its server snapshot, applies changes to typed state, then replans. Fixed commitments are rendered verbatim from input. Baselines are bounded in memory and not written to disk. This is a same-origin, single-worker local prototype; public production controls are unfinished.

Provider parsing checks envelope, numeric values, units and local timestamp offsets. No automatic Indian AQI conversion is performed. CAMS Global is model data at approximately 45 km. Missing service data is explicitly unavailable.

## Threat model and limits

Defend against user/model text injection into instructions/HTML, invented citations, forged comparison baselines, secret leakage in upstream errors, and uncontrolled model requests. Secrets remain server-side. Model failures log only their type. Global single-process limits bound planning concurrency and requests; a 25-second deadline bounds model work. Browser values are inserted as text or assigned through explicit DOM properties; constraint handlers contain fixed enum values rather than user strings. Source URLs originate in the local reviewed catalogue and are HTTPS.

The product uses DOM nodes for dynamic content, with no HTML-string rendering sinks. Delegated actions resolve against fixed application handlers and source URLs are limited to HTTP(S). Reviewed source and action records, provider values, and user commitment labels all go through text or explicit DOM properties. Browser tests confirm that markup-like commitment text renders literally through planning and comparison. The pattern scanner now reports zero HTML-rendering findings. Its remaining medium finding is the use of randomness to space retries. Comparison IDs use a separate UUID generator. This scanner checks selected source patterns.

## Evidence limitations

No clinical reviewer has certified the advice. Generic sources do not justify personalized diagnosis, precise exposure changes or numerical India-specific emissions claims. Disabled records must not be re-enabled without claim-level evidence and tests.

## 24 November release controls

Requests are buffered only up to 32 KiB before API parsing; oversized bodies return 413, including streamed bodies without Content-Length. Responses use nosniff, frame denial, no-referrer, COOP same-origin, disabled camera/microphone/geolocation permissions and a strict CSP (`script-src 'self'`, no inline code). HSTS is added behind HTTPS. API and page responses are no-store; static assets use no-cache, so the browser revalidates them with an ETag. FastAPI's /docs is exempt from the CSP because it needs CDN scripts. These controls do not replace hosting TLS or distributed rate limits. The current pattern scan is recorded in docs/security-scan.json. FastAPI's interactive documentation retains its own CDN and inline-code requirements.

## 26 November maintainability pass

Eligibility separates household restrictions, pollutant conditions and action ordering. The same catalogue, index ranges and budget order apply. Provider parsing normalizes timestamps, readings and coordinates separately. A malformed unit marks its reading unavailable while keeping the remaining valid readings. Invalid coordinates fall back to the requested city coordinates. Request guards enforce the byte cap before appending each incoming chunk and deliver one replayed body to the application.

The frontend separates form handling, JSON requests and rendering. A plan and its submitted profile are stored together when the response matches the current edit revision. A pending comparison is kept as one record and expires if its form revision no longer matches. The error view can explain an expired comparison without enabling acceptance. Same-origin modules use the existing strict CSP and safe DOM helpers.

## Attempt three state ownership

The API worker owns one limiter, snapshot store and live air-data cache. Admission is synchronous until the slot is acquired. Every admitted request counts against the rolling minute, and the active slot is released on success, failure or cancellation. The snapshot store evicts the oldest entry above 100 entries and expires entries older than 30 minutes. The live air cache copies provider results by city and expires them at 10 minutes. The model breaker prefers a distinct backup for five minutes after a transient primary error. Classes accept monotonic clocks for deterministic tests.

Developer docstrings are retained in code. Routes and schema definitions preserve their existing public OpenAPI descriptions.
