import hashlib
import hmac
import json
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.database import async_session_factory, get_redis
from src.models.category import Category
from src.models.challenge import Challenge


class ChallengeService:

    @staticmethod
    async def get_challenge_with_status(challenge_id: str) -> Challenge | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Challenge)
                .options(selectinload(Challenge.category))
                .where(Challenge.id == challenge_id)
            )
            challenge = result.scalar_one_or_none()
            if challenge is None:
                return None
            if not challenge.enabled:
                return None
            if not challenge.category.enabled:
                return None
            now = datetime.now(timezone.utc)
            if challenge.start_at and now < challenge.start_at:
                return None
            if challenge.end_at and now > challenge.end_at:
                return None
            return challenge

    @staticmethod
    async def resolve_dependency_chain(challenge: Challenge) -> list[str]:
        if not challenge.requires:
            return []
        async with async_session_factory() as session:
            required = []
            to_check = list(challenge.requires)
            while to_check:
                req_id = to_check.pop(0)
                result = await session.execute(
                    select(Challenge).where(Challenge.id == req_id)
                )
                req_chal = result.scalar_one_or_none()
                if req_chal:
                    required.append(str(req_chal.id))
                    if req_chal.requires:
                        to_check.extend(req_chal.requires)
            return required

    @staticmethod
    async def cache_challenge_status(challenge_id: str) -> None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(Challenge)
                .options(selectinload(Challenge.category))
                .where(Challenge.id == challenge_id)
            )
            challenge = result.scalar_one_or_none()
            if challenge is None:
                return
            redis_conn = await get_redis()
            status_data = {
                "enabled": challenge.enabled,
                "category_enabled": challenge.category.enabled if challenge.category else True,
            }
            await redis_conn.setex(
                f"challenge:status:{challenge_id}",
                300,
                json.dumps(status_data),
            )

    @staticmethod
    async def hash_flag(flag: str) -> str:
        return hashlib.sha256(flag.encode()).hexdigest()

    @staticmethod
    async def verify_flag(submitted_flag: str, stored_hash: str) -> bool:
        # Constant-time compare to prevent timing oracles.
        # hmac.compare_digest is also robust against length-based leaks.
        submitted_hash = hashlib.sha256(submitted_flag.encode()).hexdigest()
        return hmac.compare_digest(submitted_hash.encode(), stored_hash.encode())
