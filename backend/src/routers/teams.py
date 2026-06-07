import secrets
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user
from src.models.team import Team, TeamMember
from src.models.user import User

router = APIRouter(prefix="/api/v1/teams", tags=["teams"])


def _serialize_team(team, *, include_invite: bool = False) -> dict:
    """Serialize a Team row.  `invite_code` is only included when the
    caller is a member of the team (or the owner); never expose it in
    public listings — that's a free pass to join any team."""
    out = {
        "id": str(team.id),
        "name": team.name,
        "owner_id": str(team.owner_id),
        "member_count": len(team.members) if team.members else 0,
        "created_at": team.created_at.isoformat(),
    }
    if include_invite:
        out["invite_code"] = team.invite_code
    return out


async def _user_is_member(session, team_id, user_id) -> bool:
    from sqlalchemy import and_
    result = await session.execute(
        select(TeamMember).where(
            and_(TeamMember.team_id == team_id, TeamMember.user_id == user_id)
        )
    )
    return result.scalar_one_or_none() is not None


@router.get("/", response_model=list[dict])
async def list_teams(current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(select(Team).order_by(Team.created_at.desc()))
        teams = result.scalars().all()
        return [
            {
                "id": str(t.id),
                "name": t.name,
                "owner_id": str(t.owner_id),
                "member_count": len(t.members) if t.members else 0,
                "created_at": t.created_at.isoformat(),
            }
            for t in teams
        ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_team(name: str, current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        existing = await session.execute(select(Team).where(Team.name == name))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team name already exists")
        invite_code = secrets.token_hex(8)
        team = Team(name=name, owner_id=current_user.id, invite_code=invite_code)
        session.add(team)
        await session.flush()

        member = TeamMember(team_id=team.id, user_id=current_user.id, role="captain")
        session.add(member)
        await session.commit()
        await session.refresh(team)
        return {
            "id": str(team.id),
            "name": team.name,
            "invite_code": team.invite_code,
            "owner_id": str(team.owner_id),
        }


@router.get("/{team_id}")
async def get_team(team_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(select(Team).where(Team.id == team_id))
        team = result.scalar_one_or_none()
        if team is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        # Only the owner or a member sees the invite code.
        is_member = (
            team.owner_id == current_user.id
            or await _user_is_member(session, team.id, current_user.id)
        )
        return _serialize_team(team, include_invite=is_member)


@router.post("/{team_id}/join")
async def join_team(team_id: uuid.UUID, invite_code: str, current_user: User = Depends(get_current_user)):
    # Cap team size to prevent a single team from absorbing the entire
    # platform (and tilting the leaderboard).  Default cap is 10 —
    # generous for a CTF, tight enough to require multiple teams.
    MAX_TEAM_SIZE = 10
    async with async_session_factory() as session:
        result = await session.execute(select(Team).where(Team.id == team_id))
        team = result.scalar_one_or_none()
        if team is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        if team.invite_code != invite_code:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid invite code")
        existing = await session.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id, TeamMember.user_id == current_user.id
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already a member")
        # Count current members to enforce cap.  We do this after the
        # duplicate check so a returning member gets the right 409.
        from sqlalchemy import func as sa_func
        member_count = (
            await session.execute(
                select(sa_func.count(TeamMember.id)).where(TeamMember.team_id == team_id)
            )
        ).scalar() or 0
        if member_count >= MAX_TEAM_SIZE:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Team is full (max {MAX_TEAM_SIZE} members)",
            )
        member = TeamMember(team_id=team.id, user_id=current_user.id, role="member")
        session.add(member)
        await session.commit()
        return {"detail": "Joined team successfully"}


@router.post("/{team_id}/leave")
async def leave_team(team_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(
            select(TeamMember).where(
                TeamMember.team_id == team_id, TeamMember.user_id == current_user.id
            )
        )
        member = result.scalar_one_or_none()
        if member is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not a member of this team")
        if member.role == "captain":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Captain cannot leave. Transfer ownership first.")
        await session.delete(member)
        await session.commit()
        return {"detail": "Left team successfully"}


@router.get("/{team_id}/members")
async def get_team_members(team_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    # Only the team owner or a member may view the member list.
    # Previously, any authenticated caller could enumerate every
    # team's members — a user-enumeration + team-roster leak.
    async with async_session_factory() as session:
        team = (await session.execute(select(Team).where(Team.id == team_id))).scalar_one_or_none()
        if team is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
        is_owner = team.owner_id == current_user.id
        is_member = await _user_is_member(session, team_id, current_user.id)
        if not (is_owner or is_member or current_user.role == "admin"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member of this team to view its roster",
            )
        result = await session.execute(
            select(TeamMember).where(TeamMember.team_id == team_id)
        )
        members = result.scalars().all()
        member_list = []
        for m in members:
            user_result = await session.execute(select(User).where(User.id == m.user_id))
            user = user_result.scalar_one_or_none()
            if user:
                member_list.append({
                    "id": str(m.id),
                    "user_id": str(m.user_id),
                    "username": user.username,
                    "role": m.role,
                    "joined_at": m.joined_at.isoformat(),
                })
        return member_list
