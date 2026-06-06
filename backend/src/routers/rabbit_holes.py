import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from src.config import get_settings
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.user import User
from src.services.rabbit_hole_service import RabbitHoleService

settings = get_settings()
router = APIRouter(prefix="/api/v1/rabbit-holes", tags=["rabbit_holes"])


class RabbitHoleTrigger(BaseModel):
    # Path is a URL path or short identifier; 1KB is plenty.
    path: str = Field(..., min_length=1, max_length=1024)
    # Payload is free-form short text (e.g. user-agent, referrer, query string);
    # 4KB caps Redis memory exposure.
    payload: str | None = Field(None, max_length=4096)


@router.get("/stats")
async def get_rabbit_hole_stats(current_user: User = Depends(require_admin)):
    stats = await RabbitHoleService.get_stats()
    return stats


@router.post("/trigger")
async def trigger_rabbit_hole(
    challenge_id: uuid.UUID,
    body: RabbitHoleTrigger,
    current_user: User = Depends(get_current_user),
):
    if not settings.rabbit_holes_enabled:
        return {"detail": "Rabbit holes are disabled"}
    await RabbitHoleService.log_trigger(
        user_id=str(current_user.id),
        challenge_id=str(challenge_id),
        path=body.path,
        payload=body.payload,
    )
    return {"detail": "Rabbit hole logged"}


@router.patch("/toggle")
async def toggle_rabbit_holes(current_user: User = Depends(require_admin)):
    settings.rabbit_holes_enabled = not settings.rabbit_holes_enabled
    return {"rabbit_holes_enabled": settings.rabbit_holes_enabled}
