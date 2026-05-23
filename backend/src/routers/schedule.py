import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from src.database import async_session_factory
from src.middleware.auth_middleware import require_admin
from src.models.challenge import Challenge
from src.models.user import User
from src.services.schedule_service import ScheduleService

router = APIRouter(prefix="/api/v1/schedules", tags=["schedules"])


@router.post("/challenges/{challenge_id}")
async def schedule_challenge(
    challenge_id: uuid.UUID,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(select(Challenge).where(Challenge.id == challenge_id))
        challenge = result.scalar_one_or_none()
        if challenge is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        challenge.start_at = start_at
        challenge.end_at = end_at
        await session.commit()
        return {
            "id": str(challenge.id),
            "title": challenge.title,
            "start_at": challenge.start_at.isoformat() if challenge.start_at else None,
            "end_at": challenge.end_at.isoformat() if challenge.end_at else None,
        }


@router.get("/timeline")
async def get_timeline(current_user: User = Depends(require_admin)):
    events = await ScheduleService.get_timeline()
    return {"events": events}
