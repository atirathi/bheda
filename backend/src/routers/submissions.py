import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.submission import Submission
from src.models.user import User
from src.schemas.submission import SubmissionCreate, SubmissionRead
from src.services.submission_service import SubmissionService

router = APIRouter(prefix="/api/v1/submissions", tags=["submissions"])


@router.post("/", status_code=status.HTTP_201_CREATED)
async def submit_flag(
    body: SubmissionCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
):
    return await SubmissionService.submit(
        current_user=current_user,
        challenge_id=body.challenge_id,
        flag=body.flag,
        team_id=body.team_id,
        request=request,
    )


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
