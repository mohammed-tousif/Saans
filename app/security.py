"""Bound request bodies before parsing and protect same-origin responses."""

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


def security_headers(scope) -> list[tuple[bytes, bytes]]:
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


class RequestGuards:
    def __init__(self, app, max_bytes=32768):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)

        async def protected_send(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                headers.extend(security_headers(scope))
                message = {**message, "headers": headers}
            await send(message)

        if scope["method"] in ("POST", "PUT", "PATCH"):
            body = bytearray()
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                body.extend(message.get("body", b""))
                if len(body) > self.max_bytes:
                    await protected_send(
                        {
                            "type": "http.response.start",
                            "status": 413,
                            "headers": [(b"content-type", b"application/json")],
                        }
                    )
                    await send(
                        {
                            "type": "http.response.body",
                            "body": b'{"detail":"Request too large (maximum 32 KiB)."}',
                        }
                    )
                    return
                if not message.get("more_body", False):
                    break
            delivered = False

            async def replay():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {"type": "http.request", "body": bytes(body), "more_body": False}
                return await receive()

            return await self.app(scope, replay, protected_send)
        await self.app(scope, receive, protected_send)
