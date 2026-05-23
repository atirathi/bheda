from datetime import datetime, timezone

from sqlalchemy import select

from src.database import async_session_factory
from src.models.event import CTFEvent


class CTFService:

    @staticmethod
    async def start_event(event_id: str) -> CTFEvent | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(CTFEvent).where(CTFEvent.id == event_id)
            )
            event = result.scalar_one_or_none()
            if event is None:
                return None
            event.status = "active"
            event.start_at = datetime.now(timezone.utc)
            await session.commit()
            await session.refresh(event)
            return event

    @staticmethod
    async def end_event(event_id: str) -> CTFEvent | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(CTFEvent).where(CTFEvent.id == event_id)
            )
            event = result.scalar_one_or_none()
            if event is None:
                return None
            event.status = "ended"
            event.end_at = datetime.now(timezone.utc)
            await session.commit()
            await session.refresh(event)
            return event

    @staticmethod
    async def get_active_event() -> CTFEvent | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(CTFEvent).where(CTFEvent.status == "active")
            )
            return result.scalar_one_or_none()

    @staticmethod
    async def get_event_status(event_id: str) -> str | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(CTFEvent).where(CTFEvent.id == event_id)
            )
            event = result.scalar_one_or_none()
            if event is None:
                return None
            now = datetime.now(timezone.utc)
            if event.end_at and now > event.end_at:
                if event.status != "ended":
                    event.status = "ended"
                    await session.commit()
                return "ended"
            if event.start_at and now >= event.start_at and event.status == "pending":
                event.status = "active"
                await session.commit()
                return "active"
            return event.status
