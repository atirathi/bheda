"""Internal API used by sibling services (ctf-engine, zero-days,
vuln-app).  Every endpoint is gated by a static `X-API-Key` header
that MUST match `settings.api_key`.

These endpoints are NOT for end-users.  They mutate backend state on
behalf of the orchestrator (e.g., record a CTF instance spawn so the
admin can see it, or update a leaderboard cache that the public
leaderboard router serves).

Keep this list short and explicit — every endpoint here is one more
thing a stolen API key can do.
"""

import hmac
import uuid

from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy import select

from src.config import get_settings
from src.database import async_session_factory
from src.models.challenge import Challenge
from src.models.event import EventParticipant
from src.models.team import Team, TeamMember
from src.models.user import User

settings = get_settings()
router = APIRouter(prefix="/api/internal", tags=["internal"])


async def _require_api_key(x_api_key: str = Header(default="")) -> None:
    # Constant-time compare; the key is set in the env and never
    # compared to anything else.  `hmac.compare_digest` defends
    # against timing oracles on a partial key match.
    if not x_api_key or not hmac.compare_digest(x_api_key, settings.api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="invalid or missing X-API-Key",
        )


# ─── /challenges/{id}/state — called by vuln-app challengeChecker ───
@router.get("/challenges/{challenge_id}/state", dependencies=[Depends(_require_api_key)])
async def get_challenge_state(challenge_id: uuid.UUID):
    async with async_session_factory() as session:
        chal = (
            await session.execute(select(Challenge).where(Challenge.id == challenge_id))
        ).scalar_one_or_none()
        if chal is None:
            return {"enabled": False}
        return {"enabled": chal.enabled}


# ─── /teams — called by ctf-engine scoring.ts ───
@router.get("/teams", dependencies=[Depends(_require_api_key)])
async def list_teams_internal():
    async with async_session_factory() as session:
        rows = (await session.execute(select(Team))).scalars().all()
        return [
            {"id": str(t.id), "name": t.name, "owner_id": str(t.owner_id)}
            for t in rows
        ]


# ─── /leaderboard/update — called by ctf-engine scoring.ts ───
# No-op accept endpoint so the cross-service POST doesn't 404.  The
# public leaderboard is computed by the public router; this exists
# only for symmetry with the ctf-engine's call sites.
@router.post("/leaderboard/update", dependencies=[Depends(_require_api_key)])
async def leaderboard_update(body: dict):
    return {"ok": True, "event_id": body.get("event_id")}


# ─── /instance/spawned, /instance/teardown — called by ctf-engine ───
@router.post("/instance/spawned", dependencies=[Depends(_require_api_key)])
async def instance_spawned(body: dict):
    team_id = body.get("team_id")
    instance_id = body.get("instance_id")
    challenge_id = body.get("challenge_id")
    if not (team_id and instance_id and challenge_id):
        raise HTTPException(status_code=400, detail="team_id, instance_id, and challenge_id required")
    async with async_session_factory() as session:
        # Find an existing EventParticipant row for this team (any event)
        # and update its `instance_id` / `instance_status`.  We don't
        # try to match a specific event because the orchestrator doesn't
        # have that context.
        member = (
            await session.execute(
                select(TeamMember).where(TeamMember.team_id == team_id)
            )
        ).scalars().first()
        if member is None:
            return {"ok": True, "note": "no team member found"}
        participants = (
            await session.execute(
                select(EventParticipant).where(EventParticipant.team_id == team_id)
            )
        ).scalars().all()
        for p in participants:
            p.instance_id = str(instance_id)
            p.instance_status = "running"
        await session.commit()
    return {"ok": True}


@router.post("/instance/teardown", dependencies=[Depends(_require_api_key)])
async def instance_teardown(body: dict):
    team_id = body.get("team_id")
    if not team_id:
        raise HTTPException(status_code=400, detail="team_id required")
    async with async_session_factory() as session:
        participants = (
            await session.execute(
                select(EventParticipant).where(EventParticipant.team_id == team_id)
            )
        ).scalars().all()
        for p in participants:
            p.instance_id = None
            p.instance_status = "terminated"
        await session.commit()
    return {"ok": True}


# ─── /zero-day/status — called by zero-days service ensureUnlocked ───
@router.get("/zero-day/status", dependencies=[Depends(_require_api_key)])
async def zero_day_status(zd_id: str, user_id: str = "anonymous"):
    # In the current design, zero-day unlocks are stored in Redis by
    # the zero-days service.  Without a shared DB table, we can't
    # confirm unlock here, so we treat all `zd_id`s as locked.  The
    # zero-days service's local Redis cache is authoritative.
    return {"zd_id": zd_id, "user_id": user_id, "unlocked": False}
