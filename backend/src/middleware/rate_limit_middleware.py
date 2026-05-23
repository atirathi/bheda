import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.responses import JSONResponse

from src.database import get_redis


def create_rate_limit_middleware(
    max_requests: int = 100,
    window_seconds: int = 60,
) -> Callable[[Request, Callable[..., Awaitable[Response]]], Awaitable[Response]]:
    async def rate_limit_middleware(request: Request, call_next: Callable[..., Awaitable[Response]]) -> Response:
        client_ip = request.client.host if request.client else "unknown"
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
