from datetime import datetime, timezone

from sqlalchemy import select

from src.database import async_session_factory
from src.models.event import CTFEvent, EventParticipant
from src.services.orchestration_service import OrchestrationService


async def cleanup_expired_instances():
    now = datetime.now(timezone.utc)
    async with async_session_factory() as session:
        result = await session.execute(
            select(CTFEvent).where(
                CTFEvent.status == "active",
                CTFEvent.end_at.isnot(None),
                CTFEvent.end_at <= now,
            )
        )
        ended_events = result.scalars().all()

        for event in ended_events:
            event.status = "ended"
            participants_result = await session.execute(
                select(EventParticipant).where(EventParticipant.event_id == event.id)
            )
            participants = participants_result.scalars().all()
            for participant in participants:
                if participant.instance_id:
                    try:
                        await OrchestrationService.teardown_instance(participant.instance_id)
                    except Exception as e:
                        print(f"[Cleanup] Failed to teardown instance {participant.instance_id}: {e}")
                    participant.instance_status = "terminated"

        await session.commit()
        if ended_events:
            print(f"[Cleanup] Cleaned up {len(ended_events)} expired events")
