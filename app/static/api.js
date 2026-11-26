/** Requests made by the Saans frontend. */
export class RequestError extends Error {
  constructor(status, detail) {
    super(typeof detail === 'string' ? detail : 'Server error (' + status + ')');
    this.status = status;
    this.detail = detail;
  }
}

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
