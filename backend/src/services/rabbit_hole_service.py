import json
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
            "challenge_id": challenge_id,
            "path": path,
            "payload": payload,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        # Use json.dumps, not str(entry).  `str(dict)` produces
        # single-quoted Python repr ("{'a': 1}") which `json.loads`
        # rejects — every "recent" trigger would then be silently
        # dropped.  json.dumps round-trips cleanly.
        entry_json = json.dumps(entry)
        await redis_conn.lpush(key, entry_json)
        await redis_conn.ltrim(key, 0, 999)
        await redis_conn.expire(key, 86400)
        await redis_conn.incr("rabbithole:total_triggers")
        # Track per-user timestamps for `triggers_today` / `unique_users`
        # stats. Member is user_id, score is unix ts; ZADD updates the score
        # if the user triggers again. Trim members older than 30 days so
        # the set doesn't grow unboundedly.
        now_ts = datetime.now(timezone.utc).timestamp()
        cutoff = now_ts - 30 * 86400
        await redis_conn.zadd("rabbithole:timestamps", {str(user_id): now_ts})
        await redis_conn.zremrangebyscore("rabbithole:timestamps", "-inf", cutoff)
        # Also append to a 30-day rolling `recent` sorted set so the admin
        # dashboard can show the last 50 triggers.
        await redis_conn.zadd("rabbithole:recent", {entry_json: now_ts})
        await redis_conn.zremrangebyscore("rabbithole:recent", "-inf", cutoff)

    @staticmethod
    async def get_stats() -> dict:
        # Returns the shape expected by `frontend/src/app/admin/rabbit-holes/page.tsx`:
        #   { total_triggers, total_challenges, triggers_today, unique_users,
        #     enabled, recent? }
        # `triggers_today` and `unique_users` are computed from the Redis
        # sorted set `rabbithole:timestamps` (member = user_id, score = unix ts).
        # `total_challenges` is the number of distinct challenge ids seen in
        # the rabbit-hole log, computed from the `rabbithole:<challenge_id>`
        # list keys.
        from datetime import datetime, timedelta, timezone

        from src.config import get_settings

        settings = get_settings()
        async with async_session_factory() as session:
            total_result = await session.execute(select(func.count(Submission.id)))
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

        # Aggregate from the per-user timestamp set.
        today_start = datetime.now(timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        ).timestamp()
        triggers_today = 0
        unique_users = 0
        try:
            # ZRANGEBYSCORE: members with score in [today_start, +inf]
            today_members = await redis_conn.zrangebyscore(
                "rabbithole:timestamps", today_start, "+inf"
            )
            triggers_today = len(today_members)
            unique_users = await redis_conn.zcard("rabbithole:timestamps")
        except Exception:
            pass

        # Distinct challenge count from `rabbithole:<uuid>` keys.
        total_challenges = 0
        try:
            async for _ in redis_conn.scan_iter(match="rabbithole:*", count=500):
                total_challenges += 1
                if total_challenges >= 10_000:
                    break
        except Exception:
            pass
        # The pattern matches `rabbithole:total_triggers` / `:timestamps`
        # / `:recent` too — subtract those out.
        total_challenges = max(0, total_challenges - 3)

        # Last 50 recent triggers, newest first.
        recent: list[dict] = []
        try:
            raw = await redis_conn.zrevrange("rabbithole:recent", 0, 49, withscores=False)
            for entry in raw:
                # The member is the str(dict) we ZADD-ed; eval its keys.
                # It's our own data so this is safe (no untrusted input).
                try:
                    parsed = json.loads(entry) if entry.startswith("{") else None
                except Exception:
                    parsed = None
                if parsed:
                    recent.append({
                        "user_id": str(parsed.get("user_id", "")),
                        "challenge_id": str(parsed.get("challenge_id", "")),
                        "path": str(parsed.get("path", "")),
                        "created_at": str(parsed.get("timestamp", "")),
                    })
        except Exception:
            pass

        return {
            "total_submissions": total_submissions,
            "correct_submissions": correct_submissions,
            "incorrect_submissions": incorrect_submissions,
            "success_rate": round(correct_submissions / total_submissions * 100, 2) if total_submissions > 0 else 0.0,
            "rabbit_hole_triggers": total_triggers,
            "total_triggers": total_triggers,
            "triggers_today": triggers_today,
            "unique_users": unique_users,
            "total_challenges": total_challenges,
            "enabled": settings.rabbit_holes_enabled,
            "recent": recent,
        }
