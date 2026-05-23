import os
import platform
import time

try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    HAS_PSUTIL = False

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select

from src.database import async_session_factory, get_redis
from src.middleware.auth_middleware import require_admin
from src.models.challenge import Challenge
from src.models.submission import Submission
from src.models.user import User

router = APIRouter(prefix="/api/v1/monitor", tags=["monitor"])


@router.get("/stats")
async def get_monitor_stats(current_user: User = Depends(require_admin)):
    async with async_session_factory() as session:
        users_result = await session.execute(select(func.count(User.id)))
        total_users = users_result.scalar() or 0

        active_users_result = await session.execute(
            select(func.count(User.id)).where(User.is_active.is_(True))
        )
        active_users = active_users_result.scalar() or 0

        challenges_result = await session.execute(select(func.count(Challenge.id)))
        total_challenges = challenges_result.scalar() or 0

        submissions_result = await session.execute(select(func.count(Submission.id)))
        total_submissions = submissions_result.scalar() or 0

        correct_result = await session.execute(
            select(func.count(Submission.id)).where(Submission.correct.is_(True))
        )
        correct = correct_result.scalar() or 0

    redis_conn = await get_redis()
    redis_ping = False
    try:
        redis_ping = await redis_conn.ping()
    except Exception:
        pass

    return {
        "system": {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "python_version": platform.python_version(),
            "uptime": time.time() - psutil.boot_time() if HAS_PSUTIL else None,
        },
        "database": {
            "total_users": total_users,
            "active_users": active_users,
            "total_challenges": total_challenges,
            "total_submissions": total_submissions,
            "correct_submissions": correct,
            "accuracy": round(correct / total_submissions * 100, 2) if total_submissions > 0 else 0,
        },
        "redis": {
            "connected": redis_ping,
        },
        "timestamp": time.time(),
    }


@router.get("/logs")
async def get_logs(
    lines: int = Query(100, ge=1, le=1000),
    current_user: User = Depends(require_admin),
):
    from src.database import async_session_factory as _  # noqa
    return {"message": "Log streaming not yet implemented", "lines_requested": lines}


@router.get("/realtime")
async def get_realtime_data(current_user: User = Depends(require_admin)):
    redis_conn = await get_redis()
    keys = await redis_conn.keys("*")
    return {
        "active_keys": len(keys),
        "message": "Use WebSocket for real-time data",
    }
