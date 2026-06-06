import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import selectinload

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.category import Category
from src.models.challenge import Challenge
from src.models.user import User
from src.schemas.challenge import ChallengeAdminRead, ChallengeCreate, ChallengeRead, ChallengeToggle

router = APIRouter(prefix="/api/v1/challenges", tags=["challenges"])


@router.get("/")
async def list_challenges(
    category_id: uuid.UUID | None = Query(None),
    difficulty: str | None = Query(None),
    enabled: bool | None = Query(None),
    search: str | None = Query(None, max_length=256),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """Return a paginated `{items,total,skip,limit}` wrapper.

    The previous bare-list response forced the frontend to ask for
    `limit=1` and call `.length` to derive a "total" — which always
    returned 0 or 1.  Returning the count from the same query keeps
    pagination strict (skip+limit, max 200) while exposing a real total.
    """
    async with async_session_factory() as session:
        base_filters = []
        if current_user.role != "admin":
            base_filters.append(Challenge.enabled.is_(True))
            base_filters.append(Category.enabled.is_(True))

        if category_id:
            base_filters.append(Challenge.category_id == category_id)
        if difficulty:
            base_filters.append(Challenge.difficulty == difficulty)
        if enabled is not None and current_user.role == "admin":
            base_filters.append(Challenge.enabled.is_(enabled))
        if search:
            base_filters.append(Challenge.title.ilike(f"%{search}%"))

        count_query = (
            select(func.count(Challenge.id))
            .join(Category, Challenge.category_id == Category.id)
        )
        for f in base_filters:
            count_query = count_query.where(f)
        total = (await session.execute(count_query)).scalar_one()

        list_query = (
            select(Challenge)
            .options(selectinload(Challenge.category))
            .join(Category, Challenge.category_id == Category.id)
            .order_by(Challenge.created_at.desc())
        )
        for f in base_filters:
            list_query = list_query.where(f)
        list_query = list_query.offset(skip).limit(limit)
        result = await session.execute(list_query)
        items = result.scalars().all()

        # Admins get the full row including `flag_hash`; everyone else
        # gets the redacted `ChallengeRead` (see schema docstring).
        read_schema = ChallengeAdminRead if current_user.role == "admin" else ChallengeRead
        return {
            "items": [read_schema.model_validate(c).model_dump() for c in items],
            "total": total,
            "skip": skip,
            "limit": limit,
        }


@router.get("/{challenge_id}", response_model=ChallengeRead)
async def get_challenge(
    challenge_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    async with async_session_factory() as session:
        result = await session.execute(
            select(Challenge)
            .options(selectinload(Challenge.category))
            .where(Challenge.id == challenge_id)
        )
        challenge = result.scalar_one_or_none()
        if challenge is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        if current_user.role != "admin":
            if not challenge.enabled or not challenge.category.enabled:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        if current_user.role == "admin":
            return ChallengeAdminRead.model_validate(challenge).model_dump()
        return ChallengeRead.model_validate(challenge).model_dump()


@router.post("/", response_model=ChallengeRead, status_code=status.HTTP_201_CREATED)
async def create_challenge(
    body: ChallengeCreate,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        cat_result = await session.execute(select(Category).where(Category.id == body.category_id))
        if not cat_result.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
        challenge = Challenge(**body.model_dump())
        session.add(challenge)
        await session.commit()
        await session.refresh(challenge)
        return challenge


@router.patch("/{challenge_id}", response_model=ChallengeRead)
async def update_challenge(
    challenge_id: uuid.UUID,
    body: ChallengeToggle,
    current_user: User = Depends(require_admin),
):
    # Allowlist of toggleable fields.  Keeps callers from mass-overwriting
    # `flag_hash`, `points`, `id`, `category_id`, `created_at`, etc.
    TOGGLE_MUTABLE = frozenset({"enabled", "waf_enabled", "hint_enabled"})
    async with async_session_factory() as session:
        result = await session.execute(
            select(Challenge)
            .options(selectinload(Challenge.category))
            .where(Challenge.id == challenge_id)
        )
        challenge = result.scalar_one_or_none()
        if challenge is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        update_data = body.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            if field in TOGGLE_MUTABLE:
                setattr(challenge, field, value)
        await session.commit()
        await session.refresh(challenge)
        return challenge


@router.post("/{challenge_id}/test")
async def test_challenge_endpoint(
    challenge_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(
            select(Challenge).where(Challenge.id == challenge_id)
        )
        challenge = result.scalar_one_or_none()
        if challenge is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        if not challenge.endpoint:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Challenge has no endpoint configured")
        return {
            "challenge_id": str(challenge.id),
            "title": challenge.title,
            "endpoint": challenge.endpoint,
            "status": "endpoint_configured",
        }


@router.delete("/{challenge_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_challenge(
    challenge_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(select(Challenge).where(Challenge.id == challenge_id))
        challenge = result.scalar_one_or_none()
        if challenge is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Challenge not found")
        await session.delete(challenge)
        await session.commit()
