import json

from sqlalchemy import func, select

from src.database import async_session_factory, get_redis
from src.models.challenge import Challenge
from src.models.submission import Submission
from src.models.team import Team


class ScoringService:
    DIFFICULTY_MULTIPLIER = {
        "easy": 1.0,
        "medium": 1.5,
        "hard": 2.0,
        "expert": 3.0,
    }

    @staticmethod
    async def calculate_score(
        challenge: Challenge,
        chain_depth: int = 0,
        first_blood: bool = False,
    ) -> int:
        base = challenge.points
        diff_mult = ScoringService.DIFFICULTY_MULTIPLIER.get(challenge.difficulty, 1.0)
        chain_mult = 1.0 + (chain_depth * 0.1)
        clean_bonus = 1.2 if first_blood else 1.0
        return int(base * diff_mult * chain_mult * clean_bonus)

    @staticmethod
    async def recalculate_leaderboard(event_id: str | None = None) -> list[dict]:
        async with async_session_factory() as session:
            query = (
                select(
                    Submission.team_id,
                    func.count(Submission.id).label("solved"),
                    func.sum(Challenge.points).label("score"),
                )
                .join(Challenge, Submission.challenge_id == Challenge.id)
                .where(Submission.correct.is_(True))
                .group_by(Submission.team_id)
                .order_by(func.sum(Challenge.points).desc())
            )

            if event_id:
                from src.models.event import EventParticipant

                query = (
                    select(
                        Submission.team_id,
                        func.count(Submission.id).label("solved"),
                        func.sum(Challenge.points).label("score"),
                    )
                    .join(Challenge, Submission.challenge_id == Challenge.id)
                    .join(EventParticipant, EventParticipant.team_id == Submission.team_id)
                    .where(Submission.correct.is_(True))
                    .where(EventParticipant.event_id == event_id)
                    .group_by(Submission.team_id)
                    .order_by(func.sum(Challenge.points).desc())
                )

            result = await session.execute(query)
            rows = result.all()

            leaderboard = []
            for rank, (team_id, solved, score) in enumerate(rows, start=1):
                team_result = await session.execute(
                    select(Team).where(Team.id == team_id)
                )
                team = team_result.scalar_one_or_none()
                leaderboard.append({
                    "rank": rank,
                    "team_id": str(team_id),
                    "team_name": team.name if team else "Unknown",
                    "solved": solved,
                    "score": score if score else 0,
                })

            redis_conn = await get_redis()
            await redis_conn.set("leaderboard:data", json.dumps(leaderboard))
            return leaderboard

    @staticmethod
    async def get_cached_leaderboard() -> list[dict] | None:
        redis_conn = await get_redis()
        data = await redis_conn.get("leaderboard:data")
        if data:
            return json.loads(data)
        return None
