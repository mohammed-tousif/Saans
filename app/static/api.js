// Sends JSON requests and preserves API error details for the interface.

/** An unsuccessful HTTP response with its original API detail. */
export class RequestError extends Error {
  /**
   * Preserve the HTTP status and response detail, using a generic message for structured details.
   * @param {number} status HTTP response status.
   * @param {unknown} detail Parsed API error detail, if available.
   * @returns {RequestError} Error with the status and detail attached.
   */
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Server error (' + status + ')');
    this.status = status;
    this.detail = detail;
  }
}

/**
 * Use GET by default or POST when a JSON body is supplied.
 * @param {string} path API endpoint path.
 * @param {object} [payload] Request body to serialize.
 * @returns {Promise<unknown>} Parsed JSON from a successful response.
 * @throws {RequestError} The server returned an unsuccessful HTTP status.
 */
export async function requestJson(path, payload) {
  const options =
    payload === undefined
      ? undefined
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        };
  const response = await fetch(path, options);
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new RequestError(response.status, error?.detail);
  }
  return response.json();
}
