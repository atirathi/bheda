import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.challenge import Challenge
from src.models.event import CTFEvent, EventParticipant
from src.models.submission import Submission
from src.models.team import Team, TeamMember
from src.models.user import User
from src.schemas.submission import SubmissionCreate, SubmissionRead
from src.services.challenge_service import ChallengeService
from src.services.scoring_service import ScoringService
from src.services.websocket_manager import manager

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_flag(
    body: SubmissionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    async with async_session_factory() as session:
        challenge_result = await session.execute(
            select(Challenge)
            .options(selectinload(Challenge.category))
            .where(Challenge.id == body.challenge_id)
        )
        challenge = challenge_result.scalar_one_or_none()

        if challenge is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        if not challenge.enabled or not challenge.category.enabled:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found or disabled")

        team_id = body.team_id

        if team_id:
            team_result = await session.execute(select(Team).where(Team.id == team_id))
            team = team_result.scalar_one_or_none()
            if team is None:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Team not found")
            membership_result = await session.execute(
                select(TeamMember).where(
                    TeamMember.team_id == team_id, TeamMember.user_id == current_user.id
                )
            )
            if not membership_result.scalar_one_or_none():
                raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You are not a member of this team")

        active_event = await session.execute(
            select(CTFEvent).where(CTFEvent.status == "active")
        )
        event = active_event.scalar_one_or_none()
        if event and not team_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A CTF event is active. Submissions must be made under a team.",
            )

        if challenge.max_attempts > 0 and team_id:
            attempts_result = await session.execute(
                select(func.count(Submission.id))
                .where(
                    Submission.challenge_id == challenge.id,
                    Submission.team_id == team_id,
                )
            )
            attempts = attempts_result.scalar() or 0
            if attempts >= challenge.max_attempts:
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail="Maximum attempts exceeded for this challenge",
                )

        if challenge.requires:
            for req_id in challenge.requires:
                req_result = await session.execute(
                    select(Submission).where(
                        Submission.challenge_id == req_id,
                        Submission.team_id == team_id,
                        Submission.correct.is_(True),
                    )
                )
                if not req_result.scalar_one_or_none():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Prerequisite challenge not solved: {req_id}",
                    )

        flag_hash = await ChallengeService.hash_flag(body.flag)
        correct = flag_hash == challenge.flag_hash

        submission = Submission(
            user_id=current_user.id,
            team_id=team_id,
            challenge_id=challenge.id,
            flag_hash=flag_hash,
            correct=correct,
            ip_address=request.client.host if request.client else None,
            user_agent=request.headers.get("user-agent"),
        )
        session.add(submission)
        await session.commit()
        await session.refresh(submission)

        if correct and event:
            leaderboard = await ScoringService.recalculate_leaderboard(str(event.id))
            await manager.broadcast({"type": "leaderboard_update", "data": leaderboard})

        return {
            "correct": correct,
            "submission_id": str(submission.id),
        }


@router.get("/", response_model=list[SubmissionRead])
async def list_submissions(
    challenge_id: uuid.UUID | None = Query(None),
    user_id: uuid.UUID | None = Query(None),
    team_id: uuid.UUID | None = Query(None),
    correct: bool | None = Query(None),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        query = select(Submission).order_by(Submission.created_at.desc())
        if challenge_id:
            query = query.where(Submission.challenge_id == challenge_id)
        if user_id:
            query = query.where(Submission.user_id == user_id)
        if team_id:
            query = query.where(Submission.team_id == team_id)
        if correct is not None:
            query = query.where(Submission.correct.is_(correct))
        query = query.offset(skip).limit(limit)
        result = await session.execute(query)
        return result.scalars().all()
