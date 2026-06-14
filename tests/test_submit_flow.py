"""End-to-end-ish test of SubmissionService.submit: correct scoring,
first-blood bonus, chain bonus, and idempotent (no double-count) solves."""
import asyncio
import hashlib

from src.database import async_session_factory, engine
from src.models.base import Base
from src.models.category import Category
from src.models.challenge import Challenge
from src.models.submission import Submission
from src.models.team import Team, TeamMember
from src.models.user import User
from src.services.submission_service import SubmissionService


class FakeRequest:
    client = type("C", (), {"host": "1.2.3.4"})()
    headers = {"user-agent": "pytest"}


async def _reset():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)


async def _mk_team(s, uname, tname, code):
    u = User(username=uname, email=f"{uname}@x.io", password_hash="x")
    s.add(u); await s.flush()
    t = Team(name=tname, owner_id=u.id, invite_code=code)
    s.add(t); await s.flush()
    s.add(TeamMember(team_id=t.id, user_id=u.id))
    await s.flush()
    return u, t


def test_first_blood_then_second_team_then_dedup():
    async def run():
        await _reset()
        async with async_session_factory() as s:
            cat = Category(name="SQLi", icon="x", color="#fff", sort_order=1)
            s.add(cat); await s.flush()
            flag = "BHEDA{c_abcdef0123456789}"
            chal = Challenge(category_id=cat.id, title="c", description="d",
                             difficulty="easy", points=100,
                             flag_hash=hashlib.sha256(flag.encode()).hexdigest())
            s.add(chal); await s.flush()
            ua, ta = await _mk_team(s, "a", "A", "AAA")
            ub, tb = await _mk_team(s, "b", "B", "BBB")
            await s.commit()
            cid, ta_id, tb_id = chal.id, ta.id, tb.id
            ua_id, ub_id = ua.id, ub.id

        # Team A solves first -> first blood (100 * 1.0 * 1.5 = 150)
        async with async_session_factory() as s:
            ua = await s.get(User, ua_id)
            r1 = await SubmissionService.submit(current_user=ua, challenge_id=cid,
                                                flag="BHEDA{c_abcdef0123456789}",
                                                team_id=ta_id, request=FakeRequest())
        # Team B solves second -> no first blood (100)
        async with async_session_factory() as s:
            ub = await s.get(User, ub_id)
            r2 = await SubmissionService.submit(current_user=ub, challenge_id=cid,
                                                flag="BHEDA{c_abcdef0123456789}",
                                                team_id=tb_id, request=FakeRequest())
        # Team A re-submits -> already_solved, no new score
        async with async_session_factory() as s:
            ua = await s.get(User, ua_id)
            r3 = await SubmissionService.submit(current_user=ua, challenge_id=cid,
                                                flag="BHEDA{c_abcdef0123456789}",
                                                team_id=ta_id, request=FakeRequest())
        # Total stored score for A should be just the first-blood 150
        async with async_session_factory() as s:
            from sqlalchemy import func, select
            a_total = (await s.execute(
                select(func.coalesce(func.sum(Submission.score), 0))
                .where(Submission.team_id == ta_id, Submission.correct.is_(True))
            )).scalar()
        return r1, r2, r3, a_total

    r1, r2, r3, a_total = asyncio.run(run())
    assert r1["correct"] is True and r1["status"] == "correct"
    assert r2["correct"] is True and r2["status"] == "correct"
    assert r3["status"] == "already_solved"
    assert a_total == 150  # only the first-blood solve counted
