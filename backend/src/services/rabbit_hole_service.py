from datetime import datetime, timezone

from sqlalchemy import func, select

from src.database import async_session_factory, get_redis
from src.models.submission import Submission


class RabbitHoleService:

    @staticmethod
    async def log_trigger(
        user_id: str,
        challenge_id: str,
        path: str,
        payload: str | None = None,
    ) -> None:
        redis_conn = await get_redis()
        key = f"rabbithole:{challenge_id}"
        entry = {
            "user_id": user_id,
            "path": path,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        await redis_conn.lpush(key, str(entry))
        await redis_conn.ltrim(key, 0, 999)
        await redis_conn.expire(key, 86400)
        await redis_conn.incr("rabbithole:total_triggers")

    @staticmethod
    async def get_stats() -> dict:
        async with async_session_factory() as session:
            total_result = await session.execute(
                select(func.count(Submission.id))
            )
            total_submissions = total_result.scalar() or 0

            correct_result = await session.execute(
                select(func.count(Submission.id)).where(Submission.correct.is_(True))
            )
            correct_submissions = correct_result.scalar() or 0

            incorrect_result = await session.execute(
                select(func.count(Submission.id)).where(Submission.correct.is_(False))
            )
            incorrect_submissions = incorrect_result.scalar() or 0

        redis_conn = await get_redis()
        total_triggers_str = await redis_conn.get("rabbithole:total_triggers")
        total_triggers = int(total_triggers_str) if total_triggers_str else 0

        return {
            "total_submissions": total_submissions,
            "correct_submissions": correct_submissions,
            "incorrect_submissions": incorrect_submissions,
            "success_rate": round(correct_submissions / total_submissions * 100, 2) if total_submissions > 0 else 0.0,
            "rabbit_hole_triggers": total_triggers,
        }
