import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from src.config import get_settings
from src.database import close_redis, engine
from src.middleware.auth_middleware import create_auth_middleware
from src.middleware.challenge_middleware import create_challenge_middleware
from src.middleware.rate_limit_middleware import create_rate_limit_middleware
from src.models.base import Base
from src.routers import (
    auth_router,
    categories_router,
    challenges_router,
    ctf_compat_router,
    events_router,
    internal_router,
    leaderboard_router,
    monitor_router,
    profiles_router,
    rabbit_holes_router,
    schedule_router,
    stats_router,
    submissions_router,
    teams_router,
    users_router,
)
from src.services.websocket_manager import manager
from src.tasks.cleanup import cleanup_expired_instances
from src.tasks.scheduler import start_scheduler, stop_scheduler

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Fail fast on placeholder / weak secrets before we accept any traffic.
    settings.assert_safe()
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    from src.services.seed_service import seed_challenges
    count = await seed_challenges()
    if count:
        print(f"[seed] Loaded {count} YAML challenges into database")
    if settings.scheduler_enabled:
        start_scheduler()
    yield
    if settings.scheduler_enabled:
        stop_scheduler()
    await close_redis()
    await engine.dispose()


# Docs / OpenAPI exposure is gated by `DOCS_ENABLED` (default: false in
# config.py).  When disabled, FastAPI returns 404 for /docs, /redoc, and
# /openapi.json — the API surface is no longer public-knowledge.
app = FastAPI(
    title="Bheda Vulnerability Lab Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.docs_enabled else None,
    redoc_url="/redoc" if settings.docs_enabled else None,
    openapi_url="/openapi.json" if settings.docs_enabled else None,
)

app.add_middleware(
    CORSMiddleware,
    # `cors_origins` is a comma-separated list.  We refuse to enable
    # `*` because that combined with `allow_credentials=True` is
    # both an invalid HTTP/1.1 CORS configuration AND a CSRF
    # amplifier — browsers reject the response, so we'd be
    # operating in a "broken-but-leaky" middle state.
    allow_origins=[o.strip() for o in settings.cors_origins.split(",") if o.strip() and o.strip() != "*"],
    allow_credentials=True,
    # Restrict to methods we actually use.  Wildcard is fine here,
    # but limiting reduces the OPTIONS surface a probe can map.
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With", "X-API-Key"],
    expose_headers=["X-RateLimit-Limit", "X-RateLimit-Remaining", "Retry-After"],
    max_age=86400,
)

app.middleware("http")(create_auth_middleware())
app.middleware("http")(create_challenge_middleware())
app.middleware("http")(create_rate_limit_middleware(max_requests=100, window_seconds=60))


app.include_router(auth_router)
app.include_router(users_router)
app.include_router(teams_router)
app.include_router(challenges_router)
app.include_router(categories_router)
app.include_router(events_router)
app.include_router(submissions_router)
app.include_router(leaderboard_router)
app.include_router(profiles_router)
app.include_router(schedule_router)
app.include_router(rabbit_holes_router)
app.include_router(monitor_router)
app.include_router(stats_router)
app.include_router(ctf_compat_router)
app.include_router(internal_router)


@app.get("/api/v1/health")
async def health_check():
    # Useful for k8s liveness/readiness.  We do a cheap round-trip to
    # Postgres and Redis; a 200 here means the app can actually serve
    # traffic.  Failures return 503 with the same body shape so a
    # probe can be parsed uniformly.
    from fastapi.responses import JSONResponse

    from src.database import get_redis
    from sqlalchemy import text

    db_ok = False
    redis_ok = False
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_ok = True
    except Exception:
        pass
    try:
        r = await get_redis()
        redis_ok = await r.ping()
    except Exception:
        pass

    body = {
        "status": "healthy" if (db_ok and redis_ok) else "degraded",
        "mode": settings.mode,
        "dependencies": {"database": db_ok, "redis": redis_ok},
    }
    return JSONResponse(
        status_code=200 if (db_ok and redis_ok) else 503,
        content=body,
    )


@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    try:
        await manager.connect(websocket)
    except RuntimeError:
        # Rejected: connection was already closed by the manager.
        return
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
