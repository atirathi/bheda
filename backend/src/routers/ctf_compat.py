"""Compatibility shim: `/api/v1/ctf/*` routes that mirror the
backend's real endpoints (`/events/`, `/teams/`, `/leaderboard/`).

The frontend's `useCTFStore` and several CTF pages call paths like
`/ctf/event`, `/ctf/team`, `/ctf/leaderboard`, `/ctf/challenges`,
`/ctf/teams`, `/ctf/teams/join`, `/ctf/teams/leave`.  None of those
existed in the backend, so every page in `/ctf/*` silently failed.

Each handler here is a thin pass-through to the real service layer.
We do not duplicate business logic — the real routers and services
are the source of truth.
"""

import secrets

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user
from src.models.challenge import Challenge
from src.models.team import Team, TeamMember
from src.models.user import User
from src.services.scoring_service import ScoringService

router = APIRouter(prefix="/api/v1/ctf", tags=["ctf_compat"])


# ─── GET /ctf/event → active event + participants (auth required) ───
@router.get("/event")
async def get_ctf_event(current_user: User = Depends(get_current_user)):
    from src.models.event import CTFEvent, EventParticipant

    async with async_session_factory() as session:
        ev = (
            await session.execute(
                select(CTFEvent).where(CTFEvent.status == "active")
            )
        ).scalar_one_or_none()
        if ev is None:
            return None
        participants = (
            await session.execute(
                select(EventParticipant).where(EventParticipant.event_id == ev.id)
            )
        ).scalars().all()
        return {
            "id": str(ev.id),
            "name": ev.name,
            "description": ev.description,
            # Frontend expects `start_date` / `end_date`; map from our
            # `start_at` / `end_at` columns.
            "start_date": ev.start_at.isoformat() if ev.start_at else None,
            "end_date": ev.end_at.isoformat() if ev.end_at else None,
            "is_active": ev.status == "active",
            "max_team_size": ev.max_team_size,
            "status": ev.status,
        }


# ─── GET /ctf/team → the current user's team (or null) ───
@router.get("/team")
async def get_ctf_team(current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        membership = (
            await session.execute(
                select(TeamMember).where(TeamMember.user_id == current_user.id)
            )
        ).scalars().first()
        if membership is None:
            return None
        team = (
            await session.execute(select(Team).where(Team.id == membership.team_id))
        ).scalar_one_or_none()
        if team is None:
            return None
        # Build members list (expose invite_code since the caller is a member).
        members = (
            await session.execute(
                select(TeamMember, User)
                .join(User, TeamMember.user_id == User.id)
                .where(TeamMember.team_id == team.id)
            )
        ).all()
        return {
            "id": str(team.id),
            "name": team.name,
            "invite_code": team.invite_code,
            "score": 0,  # not computed here; client should call /leaderboard
            "members": [
                {
                    "id": str(m.TeamMember.id),
                    "username": m.User.username,
                    "email": m.User.email,
                    "role": "leader" if m.TeamMember.role == "captain" else "member",
                    "joined_at": m.TeamMember.joined_at.isoformat(),
                }
                for m in members
            ],
        }


# ─── GET /ctf/leaderboard → { leaderboard: [...] } ───
@router.get("/leaderboard")
async def get_ctf_leaderboard(current_user: User = Depends(get_current_user)):
    cached = await ScoringService.get_cached_leaderboard()
    if cached is None:
        cached = await ScoringService.recalculate_leaderboard()
    return {"leaderboard": cached}


# ─── GET /ctf/challenges → { challenges: [...] } ───
@router.get("/challenges")
async def get_ctf_challenges(current_user: User = Depends(get_current_user)):
    from sqlalchemy.orm import selectinload
    from src.models.category import Category

    async with async_session_factory() as session:
        rows = (
            await session.execute(
                select(Challenge)
                .options(selectinload(Challenge.category))
                .where(Challenge.enabled.is_(True))
                .order_by(Challenge.created_at.desc())
            )
        ).scalars().all()
        return {
            "challenges": [
                {
                    "id": str(c.id),
                    "title": c.title,
                    "category": c.category.name if c.category else "Uncategorized",
                    "difficulty": c.difficulty,
                    "points": c.points,
                    "solved": False,  # not computed here; client tracks locally
                }
                for c in rows
            ]
        }


# ─── POST /ctf/teams → create team ───
@router.post("/teams", status_code=status.HTTP_201_CREATED)
async def create_ctf_team(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    name = (body or {}).get("name", "").strip()
    if not name or len(name) > 128:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="name is required (1-128 chars)",
        )
    async with async_session_factory() as session:
        if (await session.execute(select(Team).where(Team.name == name))).scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team name already exists")
        invite_code = secrets.token_hex(8)
        team = Team(name=name, owner_id=current_user.id, invite_code=invite_code)
        session.add(team)
        await session.flush()
        session.add(TeamMember(team_id=team.id, user_id=current_user.id, role="captain"))
        await session.commit()
        await session.refresh(team)
        return {
            "id": str(team.id),
            "name": team.name,
            "invite_code": team.invite_code,
            "score": 0,
            "members": [],
        }


# ─── POST /ctf/teams/join → join team via invite_code ───
@router.post("/teams/join", status_code=status.HTTP_201_CREATED)
async def join_ctf_team(
    body: dict,
    current_user: User = Depends(get_current_user),
):
    invite_code = (body or {}).get("invite_code", "").strip()
    if not invite_code or len(invite_code) > 64:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="invite_code is required (1-64 chars)")
    async with async_session_factory() as session:
        team = (
            await session.execute(select(Team).where(Team.invite_code == invite_code))
        ).scalar_one_or_none()
        if team is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite code")
        if (
            await session.execute(
                select(TeamMember).where(
                    TeamMember.team_id == team.id, TeamMember.user_id == current_user.id
                )
            )
        ).scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already a member")
        session.add(TeamMember(team_id=team.id, user_id=current_user.id, role="member"))
        await session.commit()
        return {"id": str(team.id), "name": team.name, "invite_code": team.invite_code, "score": 0, "members": []}


# ─── POST /ctf/teams/leave → leave current team ───
@router.post("/teams/leave")
async def leave_ctf_team(current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        m = (
            await session.execute(
                select(TeamMember).where(TeamMember.user_id == current_user.id)
            )
        ).scalars().first()
        if m is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not in a team")
        if m.role == "captain":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Captain cannot leave. Transfer ownership first.")
        await session.delete(m)
        await session.commit()
        return {"detail": "Left team"}
