"""Bound request bodies before parsing and protect same-origin responses."""

from starlette.responses import JSONResponse
from starlette.types import ASGIApp, Message, Receive, Scope, Send

# Strict policy: no inline scripts, styles or handlers; only same-origin API calls.
# Google Fonts is the single third-party origin (stylesheet + font files).
CONTENT_SECURITY_POLICY = (
    "default-src 'self'; script-src 'self'; "
    "style-src 'self' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; "
    "img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; "
    "form-action 'self'; frame-ancestors 'none'"
).encode()

# FastAPI's interactive docs rely on CDN scripts and inline bootstrapping.
DOCS_PREFIXES = ("/docs", "/redoc")


def security_headers(scope: Scope) -> list[tuple[bytes, bytes]]:
    """Headers added to every response; static assets may be revalidated via ETag."""
    path = scope.get("path", "")
    cache = b"no-cache" if path.startswith("/static/") else b"no-store"
    headers = [
        (b"x-content-type-options", b"nosniff"),
        (b"x-frame-options", b"DENY"),
        (b"referrer-policy", b"no-referrer"),
        (b"permissions-policy", b"camera=(), microphone=(), geolocation=()"),
        (b"cross-origin-opener-policy", b"same-origin"),
        (b"cache-control", cache),
    ]
    if not path.startswith(DOCS_PREFIXES):
        headers.append((b"content-security-policy", CONTENT_SECURITY_POLICY))
    forwarded = dict(scope.get("headers", [])).get(b"x-forwarded-proto", b"")
    if scope.get("scheme") == "https" or forwarded == b"https":
        headers.append((b"strict-transport-security", b"max-age=31536000; includeSubDomains"))
    return headers


class RequestBodyTooLargeError(Exception):
    """The incoming body exceeded the configured byte limit."""


async def _read_body(receive: Receive, max_bytes: int) -> bytes | None:
    """Read a bounded ASGI body. A disconnect means there is no response to send."""
    body = bytearray()
    while True:
        message = await receive()
        if message["type"] == "http.disconnect":
            return None
        chunk = message.get("body", b"")
        if len(body) + len(chunk) > max_bytes:
            raise RequestBodyTooLargeError
        body.extend(chunk)
        if not message.get("more_body", False):
            return bytes(body)


def _replay_body(body: bytes, receive: Receive) -> Receive:
    pending: bytes | None = body

    async def replay() -> Message:
        nonlocal pending
        if pending is None:
            return await receive()
        message = {"type": "http.request", "body": pending, "more_body": False}
        pending = None
        return message

    return replay


class RequestGuards:
    """Enforce request size limits and attach response security headers."""

    def __init__(self, app: ASGIApp, max_bytes: int = 32_768) -> None:
        """Wrap the downstream ASGI app with a body-size limit in bytes."""
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        """Guard HTTP requests and pass other ASGI scopes through."""
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        async def protected_send(message: Message) -> None:
            if message["type"] == "http.response.start":
                headers = [*message.get("headers", []), *security_headers(scope)]
                message = {**message, "headers": headers}
            await send(message)

        if scope["method"] in {"POST", "PUT", "PATCH"}:
            try:
                body = await _read_body(receive, self.max_bytes)
            except RequestBodyTooLargeError:
                response = JSONResponse(
                    {"detail": f"Request too large (maximum {self.max_bytes:,} bytes)."},
                    status_code=413,
                )
                await response(scope, receive, protected_send)
                return
            if body is None:
                return
            receive = _replay_body(body, receive)

        await self.app(scope, receive, protected_send)
