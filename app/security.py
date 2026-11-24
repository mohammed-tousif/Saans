"""Bound request bodies before parsing and protect same-origin responses."""


class RequestGuards:
    def __init__(self, app, max_bytes=32768):
        self.app = app
        self.max_bytes = max_bytes

    async def __call__(self, scope, receive, send):
        if scope['type'] != 'http':
            return await self.app(scope, receive, send)

        async def protected_send(message):
            if message['type'] == 'http.response.start':
                headers = list(message.get('headers', []))
                headers.extend([
                    (b'x-content-type-options', b'nosniff'),
                    (b'x-frame-options', b'DENY'),
                    (b'referrer-policy', b'no-referrer'),
                    (b'permissions-policy', b'camera=(), microphone=(), geolocation=()'),
                    (b'cache-control', b'no-store'),
                ])
                message = {**message, 'headers': headers}
            await send(message)

        if scope['method'] in ('POST', 'PUT', 'PATCH'):
            body = bytearray()
            while True:
                message = await receive()
                if message['type'] == 'http.disconnect':
                    return
                body.extend(message.get('body', b''))
                if len(body) > self.max_bytes:
                    await protected_send({'type': 'http.response.start', 'status': 413,
                                          'headers': [(b'content-type', b'application/json')]})
                    await send({'type': 'http.response.body',
                                'body': b'{"detail":"Request too large (maximum 32 KiB)."}'})
                    return
                if not message.get('more_body', False):
                    break
            delivered = False

            async def replay():
                nonlocal delivered
                if not delivered:
                    delivered = True
                    return {'type': 'http.request', 'body': bytes(body), 'more_body': False}
                return await receive()

            return await self.app(scope, replay, protected_send)
        await self.app(scope, receive, protected_send)
