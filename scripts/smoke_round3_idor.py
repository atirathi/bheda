"""Round-3 IDOR smoke tests for the events register endpoint
and the team join unique-constraint race.
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


def scalar_one(v):
    r = MagicMock()
    r.scalar_one_or_none.return_value = v
    return r


def make_session(side_effects):
    session = AsyncMock()
    session.execute = AsyncMock(side_effect=side_effects)
    session.commit = AsyncMock()
    return session


def make_cm(session):
    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=False)
    return cm


def patch_factory(session):
    return patch(
        "src.routers.events.async_session_factory",
        MagicMock(return_value=make_cm(session)),
    )


async def test_register_requires_membership():
    """A user who is NOT a member of the target team must get 403."""
    from src.routers.events import register_for_event

    event = MagicMock()
    event.status = "pending"
    team = MagicMock()
    team.owner_id = uuid.uuid4()  # different from current_user.id

    session = make_session([
        scalar_one(event),
        scalar_one(team),
        scalar_one(None),  # not a member
    ])

    user = MagicMock()
    user.id = uuid.uuid4()
    user.role = "user"  # not admin

    with patch_factory(session):
        try:
            await register_for_event(
                event_id=uuid.uuid4(),
                team_id=team.id,
                current_user=user,
            )
            check("non-member register → 403", False)
        except HTTPException as e:
            check("non-member register → 403", e.status_code == 403)


async def test_register_owner_ok():
    """The team OWNER may register the team even without explicit membership."""
    from src.routers.events import register_for_event

    event = MagicMock()
    event.status = "pending"
    user = MagicMock()
    user.id = uuid.uuid4()
    user.role = "user"
    team = MagicMock()
    team.id = uuid.uuid4()
    team.owner_id = user.id  # caller is owner

    session = make_session([
        scalar_one(event),       # 1. event lookup
        scalar_one(team),        # 2. team lookup
        scalar_one(None),        # 3. TeamMember check (returns None — not a member, but owner)
        scalar_one(None),        # 4. existing participant check (returns None — not registered)
    ])
    session.add = MagicMock()

    with patch_factory(session):
        try:
            await register_for_event(
                event_id=uuid.uuid4(),
                team_id=team.id,
                current_user=user,
            )
            check("owner can register", True)
        except HTTPException as e:
            check(f"owner can register (got {e.status_code})", False)


async def test_register_admin_override():
    """An admin may register any team regardless of membership."""
    from src.routers.events import register_for_event

    event = MagicMock()
    event.status = "pending"
    user = MagicMock()
    user.id = uuid.uuid4()
    user.role = "admin"
    team = MagicMock()
    team.id = uuid.uuid4()
    team.owner_id = uuid.uuid4()  # not the admin

    session = make_session([
        scalar_one(event),
        scalar_one(team),
        scalar_one(None),  # not a member
        scalar_one(None),  # not yet registered
    ])
    session.add = MagicMock()

    with patch_factory(session):
        try:
            await register_for_event(
                event_id=uuid.uuid4(),
                team_id=team.id,
                current_user=user,
            )
            check("admin can register any team", True)
        except HTTPException as e:
            check(f"admin can register any team (got {e.status_code})", False)


async def test_register_event_not_pending():
    """An event not in `pending` status must reject with 400."""
    from src.routers.events import register_for_event

    event = MagicMock()
    event.status = "active"  # not pending

    session = make_session([scalar_one(event)])

    user = MagicMock()
    user.id = uuid.uuid4()
    user.role = "user"

    with patch_factory(session):
        try:
            await register_for_event(
                event_id=uuid.uuid4(),
                team_id=uuid.uuid4(),
                current_user=user,
            )
            check("non-pending event → 400", False)
        except HTTPException as e:
            check("non-pending event → 400", e.status_code == 400)


async def test_team_member_unique_constraint_in_model():
    """The TeamMember model MUST have a UniqueConstraint on (team_id, user_id)."""
    from src.models.team import TeamMember

    # Look for the constraint in the table args
    args = TeamMember.__table_args__
    found = False
    if isinstance(args, tuple):
        for a in args:
            if a.__class__.__name__ == "UniqueConstraint":
                cols = [c.name for c in a.columns]
                if set(cols) == {"team_id", "user_id"}:
                    found = True
                    break
    check("TeamMember has unique(team_id, user_id)", found)


async def main():
    print("\n=== Round-3 IDOR smoke tests ===\n")
    await test_register_requires_membership()
    await test_register_owner_ok()
    await test_register_admin_override()
    await test_register_event_not_pending()
    await test_team_member_unique_constraint_in_model()
    print(f"\n{PASS} passed, {FAIL} failed")
    sys.exit(1 if FAIL else 0)


asyncio.run(main())
