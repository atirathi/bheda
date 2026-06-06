import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.category import Category
from src.models.user import User
from src.schemas.category import CategoryCreate

router = APIRouter(prefix="/api/v1/categories", tags=["categories"])


@router.get("/")
async def list_categories(current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        query = select(Category).order_by(Category.sort_order.asc())
        if current_user.role != "admin":
            query = query.where(Category.enabled.is_(True))
        result = await session.execute(query)
        categories = result.scalars().all()
        return [
            {
                "id": str(c.id),
                "name": c.name,
                "icon": c.icon,
                "color": c.color,
                "sort_order": c.sort_order,
                "enabled": c.enabled,
                "description": c.description,
                "challenge_count": len(c.challenges) if c.challenges else 0,
                "created_at": c.created_at.isoformat(),
            }
            for c in categories
        ]


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_category(
    body: CategoryCreate,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        existing = await session.execute(select(Category).where(Category.name == body.name))
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already exists")
        category = Category(**body.model_dump())
        session.add(category)
        await session.commit()
        await session.refresh(category)
        return {
            "id": str(category.id),
            "name": category.name,
            "icon": category.icon,
            "color": category.color,
            "sort_order": category.sort_order,
            "enabled": category.enabled,
        }


@router.get("/{category_id}")
async def get_category(category_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(
            select(Category)
            .options(selectinload(Category.challenges))
            .where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        if current_user.role != "admin" and not category.enabled:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        return {
            "id": str(category.id),
            "name": category.name,
            "icon": category.icon,
            "color": category.color,
            "sort_order": category.sort_order,
            "enabled": category.enabled,
            "description": category.description,
            "challenges": [
                {
                    "id": str(ch.id),
                    "title": ch.title,
                    "difficulty": ch.difficulty,
                    "enabled": ch.enabled,
                    "points": ch.points,
                }
                for ch in (category.challenges or [])
                if current_user.role == "admin" or ch.enabled
            ],
            "created_at": category.created_at.isoformat(),
        }


@router.patch("/{category_id}/toggle")
async def toggle_category(
    category_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(
            select(Category)
            .options(selectinload(Category.challenges))
            .where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        category.enabled = not category.enabled
        for challenge in (category.challenges or []):
            challenge.enabled = category.enabled
        await session.commit()
        return {
            "id": str(category.id),
            "name": category.name,
            "enabled": category.enabled,
            "challenges_affected": len(category.challenges or []),
        }


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(
            select(Category)
            .options(selectinload(Category.challenges))
            .where(Category.id == category_id)
        )
        category = result.scalar_one_or_none()
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        for challenge in (category.challenges or []):
            await session.delete(challenge)
        await session.delete(category)
        await session.commit()
