import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.profile import Profile
from src.models.user import User
from src.services.profile_service import ProfileService

router = APIRouter(prefix="/api/v1/profiles", tags=["profiles"])


@router.get("/")
async def list_profiles(current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(
            select(Profile).order_by(Profile.created_at.desc())
        )
        profiles = result.scalars().all()
        return [
            {
                "id": str(p.id),
                "name": p.name,
                "description": p.description,
                "is_default": p.is_default,
                "created_at": p.created_at.isoformat(),
            }
            for p in profiles
        ]


@router.get("/current")
async def get_current_profile():
    profile = await ProfileService.get_current_profile()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No current profile set")
    return {
        "id": str(profile.id),
        "name": profile.name,
        "description": profile.description,
        "config": profile.config,
        "is_default": profile.is_default,
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_profile(
    name: str,
    description: str | None = None,
    config: dict | None = None,
    current_user: User = Depends(require_admin),
):
    try:
        profile = await ProfileService.create_profile(name, description, config)
        return {
            "id": str(profile.id),
            "name": profile.name,
            "description": profile.description,
            "is_default": profile.is_default,
        }
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))


@router.post("/{profile_id}/apply")
async def apply_profile(
    profile_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    try:
        updated = await ProfileService.apply_profile(str(profile_id))
        return {"detail": f"Profile applied", "challenges_updated": updated}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.get("/{profile_id}/export")
async def export_profile(
    profile_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    try:
        yaml_content = await ProfileService.export_profile(str(profile_id))
        return {"yaml": yaml_content}
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))


@router.delete("/{profile_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_profile(
    profile_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(select(Profile).where(Profile.id == profile_id))
        profile = result.scalar_one_or_none()
        if profile is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
        await session.delete(profile)
        await session.commit()
