# Design and trust boundaries

## 18 November 2026 repair decisions

Model output is untrusted. Pydantic permits only a short action-ID list; unknown IDs, duplicates and extra fields fail validation. All visible advice/citations come from enabled source-reviewed records. This reduces unsupported model claims but does not certify medical correctness or ranking quality.

The comparison API accepts an allowlisted typed constraint change and a temporary opaque baseline ID. It checks the profile against its server snapshot, applies changes to typed state, then replans. Fixed commitments are rendered verbatim from input. Baselines are bounded in memory and not written to disk. This is a same-origin, single-worker local prototype; public production controls are unfinished.

Provider parsing checks envelope, numeric values, units and local timestamp offsets. No automatic Indian AQI conversion is performed. CAMS Global is model data at approximately 45 km. Missing service data is explicitly unavailable.

## Threat model and limits

Defend against user/model text injection into instructions/HTML, invented citations, forged comparison baselines, secret leakage in upstream errors, and uncontrolled model requests. Secrets remain server-side. Model failures log only their type. Global single-process limits bound planning concurrency and requests; a 25-second deadline bounds model work. Browser text is escaped for text and quoted attributes; constraint handlers contain fixed enum values rather than user strings. Source URLs originate in the local reviewed catalogue and are HTTPS.

The security scanner flags all innerHTML use, including static markup and escaped templates. These require contextual review rather than treating all 20 findings as proven vulnerabilities. Runtime values in those templates come from escaped user strings, fixed enums, validated numeric provider data, or controlled source/action records. Remaining production tasks include strict CSP, replacing inline handlers, broader browser injection tests, request-body limits, deployment perimeter controls and automated privacy deletion policy. Do not claim a formal security audit has passed.

## Evidence limitations

No clinical reviewer has certified the advice. Generic sources do not justify personalized diagnosis, precise exposure changes or numerical India-specific emissions claims. Disabled records must not be re-enabled without claim-level evidence and tests.

## 24 November release controls

Requests are buffered only up to 32 KiB before API parsing; oversized bodies return 413, including streamed bodies without Content-Length. Responses use no-store, nosniff, frame denial, no-referrer and disabled camera/microphone/geolocation permissions. These controls do not replace hosting TLS, distributed rate limits or a strict CSP. The current scanner still flags 20 template assignments; its output is retained in docs/security-scan.json without claiming a pass.
