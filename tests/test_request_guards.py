"""Exercise request buffering against a simulated ASGI stream."""

import pytest

from app.security import RequestGuards


@pytest.mark.asyncio
@pytest.mark.parametrize(
    ("chunks", "expected_body", "expected_status"),
    [
        ([{"body": b"ab", "more_body": True}, {"body": b"cd"}], b"abcd", None),
        ([{"body": b"ab", "more_body": True}, {"body": b"cde"}], None, 413),
        ([{"body": b"ab", "more_body": True}, {"type": "http.disconnect"}], None, None),
        ([{"body": b""}], b"", None),
    ],
)
async def test_request_guard_handles_streamed_bodies(chunks, expected_body, expected_status):
    """Replay valid chunked input once and reject input over the byte cap."""
    messages = iter([{"type": "http.request", **chunk} for chunk in chunks])
    received = []
    responses = []

    async def receive():
        """Yield successive original request chunks."""
        return next(messages)

    async def send(message):
        """Capture middleware response messages for assertions."""
        responses.append(message)

    async def app(scope, receive, send):
        """Capture what the downstream app receives after buffering."""
        received.append(await receive())

    await RequestGuards(app, max_bytes=4)({"type": "http", "method": "POST"}, receive, send)
    expected = (
        [{"type": "http.request", "body": expected_body, "more_body": False}]
        if expected_body is not None
        else []
    )
    assert received == expected
    if expected_status is None:
        assert not responses
    else:
        assert responses[0]["status"] == expected_status
        assert (b"x-content-type-options", b"nosniff") in responses[0]["headers"]
