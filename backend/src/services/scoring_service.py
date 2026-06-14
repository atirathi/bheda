import json
import math

from sqlalchemy import func, select

from src.database import async_session_factory, get_redis
from src.models.challenge import Challenge
from src.models.submission import Submission
from src.models.team import Team


# ─── Canonical scoring constants ───
# These MUST stay in sync with ctf-engine/src/scoring.ts. The backend
# serves the Postgres leaderboard and the ctf-engine serves the Redis
# leaderboard; if the formulas diverge the two rank teams differently.
CHAIN_BONUS_PER_DEPTH = 0.15
FIRST_BLOOD_MULTIPLIER = 1.5


class ScoringService:
    DIFFICULTY_MULTIPLIER = {
        "beginner": 0.5,
        "easy": 1.0,
        "medium": 1.5,
        "hard": 2.0,
        "expert": 3.0,
        "insane": 3.0,
        "boss": 4.0,
    }

    @staticmethod
    async def calculate_score(
        challenge: Challenge,
        chain_depth: int = 0,
        first_blood: bool = False,
    ) -> int:
        base = challenge.points
        diff_mult = ScoringService.DIFFICULTY_MULTIPLIER.get(challenge.difficulty, 1.0)
        chain_mult = 1.0 + (chain_depth * CHAIN_BONUS_PER_DEPTH)
        clean_bonus = FIRST_BLOOD_MULTIPLIER if first_blood else 1.0
        # floor(x + 0.5) matches JS Math.round in ctf-engine for exact
        # cross-engine parity (Python's round() is banker's rounding).
        return math.floor(base * diff_mult * chain_mult * clean_bonus + 0.5)

    @staticmethod
    async def recalculate_leaderboard(event_id: str | None = None) -> list[dict]:
        async with async_session_factory() as session:
            # Step 1: collapse to the FIRST correct solve per (team, challenge).
            # DISTINCT ON keeps only the earliest row, so re-submitting a flag
            # already solved can never double-count toward the score.
            first_solves = (
                select(
                    Submission.team_id.label("team_id"),
                    Submission.challenge_id.label("challenge_id"),
                    Submission.score.label("score"),
                    Submission.created_at.label("solved_at"),
                )
                .where(Submission.correct.is_(True))
                .where(Submission.team_id.isnot(None))
                .distinct(Submission.team_id, Submission.challenge_id)
                .order_by(
                    Submission.team_id,
                    Submission.challenge_id,
                    Submission.created_at.asc(),
                )
            )

            if event_id:
                from src.models.event import EventParticipant

                first_solves = first_solves.join(
                    EventParticipant,
                    EventParticipant.team_id == Submission.team_id,
                ).where(EventParticipant.event_id == event_id)

            fs = first_solves.subquery()

            # Step 2: aggregate per team. Rank by total score; break ties by
            # who reached their score first (earliest last-solve wins) so
            # equal-score teams get a stable, fair ordering.
            agg = (
                select(
                    fs.c.team_id,
                    func.count().label("solved"),
                    func.coalesce(func.sum(fs.c.score), 0).label("score"),
                    func.max(fs.c.solved_at).label("last_solve"),
                )
                .group_by(fs.c.team_id)
                .order_by(
                    func.coalesce(func.sum(fs.c.score), 0).desc(),
                    func.max(fs.c.solved_at).asc(),
                )
            )

            rows = (await session.execute(agg)).all()

            leaderboard = []
            for rank, (team_id, solved, score, _last_solve) in enumerate(rows, start=1):
                team_result = await session.execute(
                    select(Team).where(Team.id == team_id)
                )
                team = team_result.scalar_one_or_none()
                leaderboard.append({
                    "rank": rank,
                    "team_id": str(team_id),
                    "team_name": team.name if team else "Unknown",
                    "solved": solved,
                    "score": int(score) if score else 0,
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
