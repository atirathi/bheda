import json
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.responses import JSONResponse

from src.database import get_redis


def create_challenge_middleware() -> Callable[[Request, Callable[..., Awaitable[Response]]], Awaitable[Response]]:
    async def challenge_middleware(request: Request, call_next: Callable[..., Awaitable[Response]]) -> Response:
        path = request.url.path
        if path.startswith("/api/v1/challenges/") and request.method == "GET":
            parts = path.strip("/").split("/")
            if len(parts) >= 4:
                challenge_id = parts[3]
                redis_conn = await get_redis()
                cache_key = f"challenge:status:{challenge_id}"
                cached = await redis_conn.get(cache_key)
                if cached is not None:
                    status_data = json.loads(cached)
                    if not status_data.get("enabled") or not status_data.get("category_enabled"):
                        return JSONResponse(
                            status_code=404,
                            content={"detail": "Challenge not found or disabled"},
                        )
                response = await call_next(request)
                return response
        if path.startswith("/api/v1/categories/") and request.method == "GET":
            parts = path.strip("/").split("/")
            if len(parts) >= 4:
                cat_id = parts[3]
                redis_conn = await get_redis()
                cache_key = f"category:status:{cat_id}"
                cached = await redis_conn.get(cache_key)
                if cached is not None:
                    status_data = json.loads(cached)
                    if not status_data.get("enabled"):
                        return JSONResponse(
                            status_code=404,
                            content={"detail": "Category not found or disabled"},
                        )
        return await call_next(request)
    return challenge_middleware
