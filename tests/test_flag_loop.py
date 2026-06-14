"""The full flag loop: the seeder hashes the deterministic flag, and the
exact flag a player extracts from the vuln-app (generate_flag) validates
as correct on submission. This is the end-to-end contract that makes the
platform actually playable."""
import asyncio
import uuid

from sqlalchemy import select

from src.database import async_session_factory, engine
from src.models.base import Base
from src.models.category import Category
from src.models.challenge import Challenge
from src.models.team import Team, TeamMember
from src.models.user import User
from src.services import seed_service
from src.services.submission_service import SubmissionService
from src.utils.flag import generate_flag


class FakeRequest:
    client = type("C", (), {"host": "1.2.3.4"})()
    headers = {"user-agent": "pytest"}


def test_extracted_flag_validates_against_seeded_challenge():
    async def run():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        await seed_service.seed_challenges()

        # sqli-01 gets a deterministic UUID from its source id.
        cid = uuid.uuid5(uuid.NAMESPACE_DNS, "bheda/challenge/sqli-01")
        async with async_session_factory() as s:
            chal = await s.get(Challenge, cid)
            assert chal is not None, "sqli-01 was not seeded"
            u = User(username="p", email="p@x.io", password_hash="x")
            s.add(u); await s.flush()
            t = Team(name="T", owner_id=u.id, invite_code="TTT")
            s.add(t); await s.flush()
            s.add(TeamMember(team_id=t.id, user_id=u.id))
            # Second team to test wrong-flag rejection on an unsolved board.
            u2 = User(username="q", email="q@x.io", password_hash="x")
            s.add(u2); await s.flush()
            t2 = Team(name="T2", owner_id=u2.id, invite_code="TT2")
            s.add(t2); await s.flush()
            s.add(TeamMember(team_id=t2.id, user_id=u2.id))
            await s.commit()
            uid, tid = u.id, t.id
            uid2, tid2 = u2.id, t2.id

        # The flag the player extracts from the vuln-app via SQLi:
        extracted = generate_flag("sqli-01")
        async with async_session_factory() as s:
            u = await s.get(User, uid)
            good = await SubmissionService.submit(current_user=u, challenge_id=cid,
                                                  flag=extracted, team_id=tid,
                                                  request=FakeRequest())
        # A fresh team submitting the old guessable static flag must be rejected.
        async with async_session_factory() as s:
            u2 = await s.get(User, uid2)
            bad = await SubmissionService.submit(current_user=u2, challenge_id=cid,
                                                 flag="BHEDA{sqli_challenge_01}",
                                                 team_id=tid2, request=FakeRequest())
        return good, bad

    good, bad = asyncio.run(run())
    assert good["correct"] is True and good["score"] > 0
    # The old guessable static flag must NOT validate anymore.
    assert bad["correct"] is False
