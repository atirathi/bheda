import ipaddress
import time
from collections.abc import Awaitable, Callable

from fastapi import Request, Response
from starlette.responses import JSONResponse

from src.config import get_settings
from src.database import get_redis


def _parse_trusted_proxies() -> list[ipaddress._BaseNetwork]:
    """Parse the `TRUSTED_PROXIES` env var into a list of networks.

    Invalid entries are logged and skipped — we never want a typo to
    silently fall through to "trust everything".
    """
    settings = get_settings()
    nets: list[ipaddress._BaseNetwork] = []
    for raw in (settings.trusted_proxies or "").split(","):
        raw = raw.strip()
        if not raw:
            continue
        try:
            nets.append(ipaddress.ip_network(raw, strict=False))
        except ValueError:
            # Skip bad entry; do NOT crash on a typo at startup.
            continue
    return nets


_TRUSTED_PROXIES = _parse_trusted_proxies()


def _is_trusted_proxy(addr: str | None) -> bool:
    if not addr:
        return False
    try:
        ip = ipaddress.ip_address(addr.split("%")[0])
    except ValueError:
        return False
    return any(ip in net for net in _TRUSTED_PROXIES)


def _extract_client_ip(request: Request) -> str:
    """Return the real client IP, trusting forwarded headers only when
    the immediate connection comes from a `TRUSTED_PROXIES` address.

    Without this, a deployment behind Traefik would have every request
    appear to come from the proxy's docker-network IP — collapsing all
    clients into a single rate-limit bucket (a DoS amplifier for the
    proxy's IP).

    Without trusted-proxy enforcement, anyone could set
    `X-Forwarded-For: 1.2.3.4` and bypass the per-IP rate limit.
    """
    immediate_peer = request.client.host if request.client else None
    if _is_trusted_proxy(immediate_peer):
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
    return immediate_peer or "unknown"


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
