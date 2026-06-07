"""Public aggregate stats used by the homepage.

Lives in `monitor.py` because it's a derived view of the same
counters (`total_challenges`, `active_users`, etc.).  Endpoint is
public — no auth — so unauthenticated visitors can see the platform
size.  We deliberately do NOT expose admin-only counters (total
submissions, accuracy, redis health, system info) here.
"""

from fastapi import APIRouter
from sqlalchemy import func, select

from src.database import async_session_factory
from src.models.challenge import Challenge
from src.models.event import CTFEvent
from src.models.user import User

router = APIRouter(prefix="/api/v1/stats", tags=["stats"])


@router.get("/")
async def public_stats():
    async with async_session_factory() as session:
        total_challenges = (
            await session.execute(select(func.count(Challenge.id)))
        ).scalar() or 0

        active_users = (
            await session.execute(
                select(func.count(User.id)).where(User.is_active.is_(True))
            )
        ).scalar() or 0

        # Treat "ctf_active" as: at least one event whose status is
        # `active`.  We deliberately don't include participant counts
        # from /events/active (that route is auth-gated for a reason).
        active_event_count = (
            await session.execute(
                select(func.count(CTFEvent.id)).where(CTFEvent.status == "active")
            )
        ).scalar() or 0

    return {
        "total_challenges": total_challenges,
        "active_users": active_users,
        "ctf_active": active_event_count > 0,
        "ctf_participants": 0,  # not exposed publicly; clients should refetch on event page
        "categories": [],  # home page builds this from the public categories list
    }
