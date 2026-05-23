from datetime import datetime, timedelta, timezone

from sqlalchemy import select

from src.database import async_session_factory
from src.models.challenge import Challenge
from src.models.category import Category


class ScheduleService:

    @staticmethod
    async def check_and_execute() -> list[dict]:
        actions = []
        now = datetime.now(timezone.utc)
        window = timedelta(seconds=60)

        async with async_session_factory() as session:
            challenges_result = await session.execute(
                select(Challenge).where(
                    (Challenge.start_at.isnot(None)) | (Challenge.end_at.isnot(None))
                )
            )
            challenges = challenges_result.scalars().all()

            for challenge in challenges:
                if challenge.start_at and challenge.start_at - window <= now <= challenge.start_at + window:
                    if not challenge.enabled:
                        challenge.enabled = True
                        actions.append({
                            "type": "challenge_enable",
                            "id": str(challenge.id),
                            "title": challenge.title,
                        })
                if challenge.end_at and challenge.end_at - window <= now <= challenge.end_at + window:
                    if challenge.enabled:
                        challenge.enabled = False
                        actions.append({
                            "type": "challenge_disable",
                            "id": str(challenge.id),
                            "title": challenge.title,
                        })

            await session.commit()
            return actions

    @staticmethod
    async def get_timeline() -> list[dict]:
        events = []
        async with async_session_factory() as session:
            challenges_result = await session.execute(
                select(Challenge).where(
                    (Challenge.start_at.isnot(None)) | (Challenge.end_at.isnot(None))
                )
            )
            challenges = challenges_result.scalars().all()

            for challenge in challenges:
                if challenge.start_at:
                    events.append({
                        "type": "challenge_start",
                        "title": challenge.title,
                        "at": challenge.start_at.isoformat(),
                        "id": str(challenge.id),
                    })
                if challenge.end_at:
                    events.append({
                        "type": "challenge_end",
                        "title": challenge.title,
                        "at": challenge.end_at.isoformat(),
                        "id": str(challenge.id),
                    })

            events.sort(key=lambda e: e["at"])
            return events
