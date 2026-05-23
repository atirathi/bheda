import uuid

from fastapi import APIRouter, Depends

from src.config import get_settings
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.user import User
from src.services.rabbit_hole_service import RabbitHoleService

settings = get_settings()
router = APIRouter(prefix="/api/v1/rabbit-holes", tags=["rabbit_holes"])


@router.get("/stats")
async def get_rabbit_hole_stats(current_user: User = Depends(require_admin)):
    stats = await RabbitHoleService.get_stats()
    return stats


@router.post("/trigger")
async def trigger_rabbit_hole(
    challenge_id: uuid.UUID,
    path: str,
    payload: str | None = None,
    current_user: User = Depends(get_current_user),
):
    if not settings.rabbit_holes_enabled:
        return {"detail": "Rabbit holes are disabled"}
    await RabbitHoleService.log_trigger(
        user_id=str(current_user.id),
        challenge_id=str(challenge_id),
        path=path,
        payload=payload,
    )
    return {"detail": "Rabbit hole logged"}


@router.patch("/toggle")
async def toggle_rabbit_holes(current_user: User = Depends(require_admin)):
    settings.rabbit_holes_enabled = not settings.rabbit_holes_enabled
    return {"rabbit_holes_enabled": settings.rabbit_holes_enabled}
