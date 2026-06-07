"""Round-3 smoke tests for `SubmissionService.submit()`.

Verifies the two bugs fixed in round 3:

1.  `max_attempts` cap used to only apply when `team_id` was set.
2.  The `/challenges/submit` alias used to skip the `requires`
    chain-dependency check.
"""
import asyncio
import os
import sys
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

os.environ.setdefault("MODE", "production")
os.environ.setdefault("SECRET_KEY", "a" * 64)
os.environ.setdefault("API_KEY", "b" * 32)
os.environ.setdefault("POSTGRES_PASSWORD", "c" * 32)
os.environ.setdefault("REDIS_PASSWORD", "d" * 32)
os.environ.setdefault("MONGO_PASSWORD", "e" * 32)
os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://x:x@localhost/x")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("MONGO_URL", "mongodb://localhost:27017/x")

sys.path.insert(0, "backend")

from fastapi import HTTPException  # noqa: E402

from src.services.submission_service import SubmissionService  # noqa: E402

PASS = 0
FAIL = 0


def check(name, cond):
    global PASS, FAIL
    if cond:
        PASS += 1
        print(f"  ✓ {name}")
    else:
        FAIL += 1
        print(f"  ✗ {name}")


def make_challenge(*, max_attempts=0, requires=None, enabled=True, category_enabled=True):
    chal = MagicMock()
    chal.id = uuid.uuid4()
    chal.max_attempts = max_attempts
    chal.requires = requires or []
    chal.enabled = enabled
    chal.flag_hash = "deadbeef"
    chal.category.enabled = category_enabled
    return chal


def make_session(side_effects):
    """Build a mock async session whose execute() returns successive
    pre-canned result objects."""
    session = AsyncMock()
    session.execute = AsyncMock(side_effect=side_effects)
    session.commit = AsyncMock()
    session.refresh = AsyncMock()
    session.add = MagicMock()
    return session


def make_cm(session):
    """Wrap a session in a working async context manager."""
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=False)
    return cm


def make_user():
    user = MagicMock()
    user.id = uuid.uuid4()
    return user


def make_request():
    req = MagicMock()
    req.client.host = "203.0.113.7"
    req.headers.get = lambda k, default=None: "ua" if k == "user-agent" else default
    return req


def patch_factory(session):
    return patch(
        "src.services.submission_service.async_session_factory",
        MagicMock(return_value=make_cm(session)),
    )


def scalar_one(v):
    r = MagicMock()
    r.scalar_one_or_none.return_value = v
    return r


def scalar_count(v):
    r = MagicMock()
    r.scalar.return_value = v
    return r


async def test_solo_max_attempts():
    chal = make_challenge(max_attempts=3)
    session = make_session(
        [scalar_one(chal), scalar_one(None), scalar_count(3)]
    )
    with patch_factory(session):
        try:
            await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="any",
                team_id=None,
                request=make_request(),
            )
            check("solo max_attempts cap enforced", False)
        except HTTPException as e:
            check("solo max_attempts cap enforced", e.status_code == 429)


async def test_solo_under_cap_succeeds():
    """A solo user UNDER the cap must NOT be 429ed."""
    chal = make_challenge(max_attempts=3)
    session = make_session(
        [scalar_one(chal), scalar_one(None), scalar_count(2)]
    )
    submission = MagicMock()
    submission.id = uuid.uuid4()
    with patch_factory(session), \
         patch("src.services.submission_service.ChallengeService.verify_flag", AsyncMock(return_value=False)), \
         patch("src.services.submission_service.ChallengeService.hash_flag", AsyncMock(return_value="h")):
        try:
            result = await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="wrong",
                team_id=None,
                request=make_request(),
            )
            check("solo under-cap accepted", result.get("status") == "accepted")
            check("solo under-cap correct=False", result.get("correct") is False)
        except HTTPException as e:
            check(f"solo under-cap accepted (got {e.status_code})", False)


async def test_solo_chain_dependency():
    prereq = uuid.uuid4()
    chal = make_challenge(requires=[prereq])
    session = make_session(
        [scalar_one(chal), scalar_one(None), scalar_one(None)]
    )
    with patch_factory(session):
        try:
            await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="any",
                team_id=None,
                request=make_request(),
            )
            check("solo requires chain enforced", False)
        except HTTPException as e:
            check("solo requires chain enforced", e.status_code == 400 and "Prerequisite" in e.detail)


async def test_team_chain_dependency():
    prereq = uuid.uuid4()
    chal = make_challenge(requires=[prereq])
    team = MagicMock()
    member = MagicMock()
    session = make_session(
        [scalar_one(chal), scalar_one(team), scalar_one(member), scalar_one(None), scalar_one(None)]
    )
    with patch_factory(session):
        try:
            await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="any",
                team_id=uuid.uuid4(),
                request=make_request(),
            )
            check("team requires chain enforced", False)
        except HTTPException as e:
            check("team requires chain enforced", e.status_code == 400 and "Prerequisite" in e.detail)


async def test_team_chain_satisfied():
    """When the prerequisite IS solved, the submission must proceed."""
    prereq = uuid.uuid4()
    chal = make_challenge(requires=[prereq])
    team = MagicMock()
    member = MagicMock()
    solved = MagicMock()
    session = make_session(
        [
            scalar_one(chal),
            scalar_one(team),
            scalar_one(member),
            scalar_one(None),  # no active event
            scalar_one(solved),  # prereq IS solved
        ]
    )
    with patch_factory(session), \
         patch("src.services.submission_service.ChallengeService.verify_flag", AsyncMock(return_value=False)), \
         patch("src.services.submission_service.ChallengeService.hash_flag", AsyncMock(return_value="h")):
        try:
            result = await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="wrong",
                team_id=uuid.uuid4(),
                request=make_request(),
            )
            check("team chain satisfied proceeds", result.get("status") == "accepted")
        except HTTPException as e:
            check(f"team chain satisfied proceeds (got {e.status_code}: {e.detail})", False)


async def test_disabled_challenge():
    chal = make_challenge(enabled=False)
    session = make_session([scalar_one(chal)])
    with patch_factory(session):
        try:
            await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="any",
                team_id=None,
                request=make_request(),
            )
            check("disabled challenge → 404", False)
        except HTTPException as e:
            check("disabled challenge → 404", e.status_code == 404)


async def test_active_event_requires_team():
    """When a CTF event is active, solo submissions must be 400'd."""
    chal = make_challenge()
    event = MagicMock()
    event.status = "active"
    session = make_session([scalar_one(chal), scalar_one(event)])
    with patch_factory(session):
        try:
            await SubmissionService.submit(
                current_user=make_user(),
                challenge_id=chal.id,
                flag="any",
                team_id=None,
                request=make_request(),
            )
            check("active event forces team → 400", False)
        except HTTPException as e:
            check("active event forces team → 400", e.status_code == 400 and "team" in e.detail.lower())


async def test_response_shape():
    chal = make_challenge()
    session = make_session([scalar_one(chal), scalar_one(None)])
    with patch_factory(session), \
         patch("src.services.submission_service.ChallengeService.verify_flag", AsyncMock(return_value=True)), \
         patch("src.services.submission_service.ChallengeService.hash_flag", AsyncMock(return_value="h")):
        result = await SubmissionService.submit(
            current_user=make_user(),
            challenge_id=chal.id,
            flag="BHEDA{test_aaaaaaaaaaaaaaaa}",
            team_id=None,
            request=make_request(),
        )
    check("response has submission_id", "submission_id" in result)
    check("response has status", "status" in result)
    check("response has correct", "correct" in result)
    check("response correct=True", result.get("correct") is True)
    check("response status=correct", result.get("status") == "correct")


async def main():
    print("\n=== Round-3 SubmissionService smoke tests ===\n")
    await test_solo_max_attempts()
    await test_solo_under_cap_succeeds()
    await test_solo_chain_dependency()
    await test_team_chain_dependency()
    await test_team_chain_satisfied()
    await test_disabled_challenge()
    await test_active_event_requires_team()
    await test_response_shape()
    print(f"\n{PASS} passed, {FAIL} failed")
    sys.exit(1 if FAIL else 0)


asyncio.run(main())
