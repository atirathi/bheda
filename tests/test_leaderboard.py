"""Integration tests for the Postgres-backed leaderboard.

Pins three properties a competition leaderboard MUST have:
  1. ranking uses the *computed* score stored per submission, not the
     challenge's raw points (so difficulty / chain / first-blood count);
  2. re-submitting a flag already solved does not double-count;
  3. equal scores are broken by who reached the score first (earliest
     last-solve wins), so ranks are stable instead of arbitrary.
"""
import asyncio
import datetime
import uuid

import pytest

from src.database import async_session_factory, engine
from src.models.base import Base
from src.models.category import Category
from src.models.challenge import Challenge
from src.models.submission import Submission
from src.models.team import Team
from src.models.user import User
from src.services.scoring_service import ScoringService


async def _reset_schema():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


def _dt(secs):
    return datetime.datetime(2026, 1, 1, tzinfo=datetime.timezone.utc) + datetime.timedelta(seconds=secs)


async def _seed():
    async with async_session_factory() as s:
        cat = Category(name="SQLi", icon="x", color="#fff", sort_order=1)
        s.add(cat)
        await s.flush()
        chal = Challenge(category_id=cat.id, title="c1", description="d",
                         difficulty="hard", flag_hash="h", points=100)
        s.add(chal)
        owner_a = User(username="a", email="a@x.io", password_hash="x")
        owner_b = User(username="b", email="b@x.io", password_hash="x")
        s.add_all([owner_a, owner_b])
        await s.flush()
        team_a = Team(name="A", owner_id=owner_a.id, invite_code="AAA")
        team_b = Team(name="B", owner_id=owner_b.id, invite_code="BBB")
        s.add_all([team_a, team_b])
        await s.flush()
        await s.commit()
        return chal.id, team_a.id, team_b.id, owner_a.id, owner_b.id


async def _add_sub(team_id, user_id, chal_id, score, correct, when):
    async with async_session_factory() as s:
        sub = Submission(user_id=user_id, team_id=team_id, challenge_id=chal_id,
                         flag_hash="h", correct=correct, score=score, created_at=when)
        s.add(sub)
        await s.commit()


def test_leaderboard_uses_stored_score_dedups_and_tiebreaks():
    async def run():
        await _reset_schema()
        chal_id, team_a, team_b, user_a, user_b = await _seed()
        # Team A solves once for 345 at t=10
        await _add_sub(team_a, user_a, chal_id, 345, True, _dt(10))
        # Team B solves at t=5 (earlier) for 345, then re-submits (must not double)
        await _add_sub(team_b, user_b, chal_id, 345, True, _dt(5))
        await _add_sub(team_b, user_b, chal_id, 345, True, _dt(20))
        lb = await ScoringService.recalculate_leaderboard()
        return lb

    lb = asyncio.run(run())
    by_team = {row["team_name"]: row for row in lb}
    # Stored score (345), not raw points (100)
    assert by_team["A"]["score"] == 345
    # Dedup: B solved the one challenge once, not twice
    assert by_team["B"]["score"] == 345
    assert by_team["B"]["solved"] == 1
    # Tiebreak: B reached 345 first (t=5 < t=10) -> rank 1
    assert by_team["B"]["rank"] == 1
    assert by_team["A"]["rank"] == 2
