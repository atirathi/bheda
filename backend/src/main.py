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
    events_router,
    leaderboard_router,
    monitor_router,
    profiles_router,
    rabbit_holes_router,
    schedule_router,
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


app = FastAPI(
    title="Bheda Vulnerability Lab Platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "mode": settings.mode}


@app.websocket("/api/v1/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            if data.get("type") == "ping":
                await websocket.send_json({"type": "pong"})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
