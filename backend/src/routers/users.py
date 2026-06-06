import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.user import User
from src.schemas.user import UserRead, UserUpdate

router = APIRouter(prefix="/api/v1/users", tags=["users"])


@router.get("/", response_model=list[UserRead])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(
            select(User).offset(skip).limit(limit).order_by(User.created_at.desc())
        )
        return result.scalars().all()


@router.get("/{user_id}", response_model=UserRead)
async def get_user(
    user_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    # Only admins or the user themselves may read a user record.
    # Returning the full record (email, role, ban status) to any
    # authenticated caller was a user-enumeration leak.
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only view your own account",
        )
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        return user


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: uuid.UUID,
    body: UserUpdate,
    current_user: User = Depends(get_current_user),
):
    # Only admins, or the user themselves (for self-edits of email/username),
    # may update a user.  A non-admin who targets someone else's id gets 403.
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only update your own account",
        )
    # Strict allowlist of mutable columns — prevents callers from
    # overwriting `id`, `password_hash`, `mfa_secret`, or any relationship
    # attribute that happens to share a name with a Pydantic field.
    USER_MUTABLE = frozenset({"email", "username", "is_active", "is_banned", "role"})
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        update_data = body.model_dump(exclude_unset=True)
        # Only admins may change `role` or `is_banned`; everything else
        # (email, username, is_active) is open to the user themselves.
        if ("role" in update_data or "is_banned" in update_data) and current_user.role != "admin":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admins can change role or ban status",
            )
        # Prevent an admin from demoting themselves out of admin (lockout).
        if "role" in update_data and current_user.id == user_id and update_data["role"] != "admin":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Admins cannot remove their own admin role",
            )
        for field, value in update_data.items():
            if field in USER_MUTABLE:
                setattr(user, field, value)
        await session.commit()
        await session.refresh(user)
        return user


@router.patch("/{user_id}/ban", response_model=UserRead)
async def ban_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        user.is_banned = not user.is_banned
        await session.commit()
        await session.refresh(user)
        return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(select(User).where(User.id == user_id))
        user = result.scalar_one_or_none()
        if user is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
        await session.delete(user)
        await session.commit()
