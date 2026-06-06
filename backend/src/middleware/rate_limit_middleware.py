import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.responses import JSONResponse

from src.database import get_redis


def _extract_client_ip(request: Request) -> str:
    """Return the real client IP, trusting forwarded headers when a
    trusted proxy is in front of us.

    Without this, a deployment behind Traefik would have every request
    appear to come from the proxy's docker-network IP — collapsing all
    clients into a single rate-limit bucket (a DoS amplifier for the
    proxy's IP).
    """
    # X-Forwarded-For is the de-facto standard. Take the FIRST entry
    # (the original client) and strip the port if present.
    fwd = request.headers.get("x-forwarded-for")
    if fwd:
        first = fwd.split(",", 1)[0].strip()
        # If the entry is an IPv4:port or [IPv6]:port, drop the port.
        if first.startswith("[") and "]" in first:
            first = first[1 : first.index("]")]
        elif first.count(":") == 1:
            first = first.rsplit(":", 1)[0]
        if first:
            return first
    real = request.headers.get("x-real-ip")
    if real:
        return real.strip()
    return request.client.host if request.client else "unknown"


def create_rate_limit_middleware(
    max_requests: int = 100,
    window_seconds: int = 60,
) -> Callable[[Request, Callable[..., Awaitable[Response]]], Awaitable[Response]]:
    async def rate_limit_middleware(request: Request, call_next: Callable[..., Awaitable[Response]]) -> Response:
        client_ip = _extract_client_ip(request)
        route_path = request.url.path

        if route_path.startswith(("/docs", "/openapi.json", "/redoc")):
            return await call_next(request)

        redis_conn = await get_redis()
        key = f"ratelimit:{client_ip}:{route_path}"
        now = time.time()
        window_start = now - window_seconds

        await redis_conn.zremrangebyscore(key, 0, window_start)
        request_count = await redis_conn.zcard(key)

        if request_count >= max_requests:
            return JSONResponse(
                status_code=429,
                content={"detail": "Too many requests. Please try again later."},
                headers={"Retry-After": str(window_seconds)},
            )

        await redis_conn.zadd(key, {str(now): now})
        await redis_conn.expire(key, window_seconds + 1)

        response = await call_next(request)
        response.headers["X-RateLimit-Limit"] = str(max_requests)
        response.headers["X-RateLimit-Remaining"] = str(max(0, max_requests - request_count - 1))
        return response
    return rate_limit_middleware
