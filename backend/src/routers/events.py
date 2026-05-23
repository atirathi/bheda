import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from src.database import async_session_factory
from src.middleware.auth_middleware import get_current_user, require_admin
from src.models.event import CTFEvent, EventParticipant
from src.models.user import User
from src.schemas.event import EventCreate, EventRead
from src.services.ctf_service import CTFService

router = APIRouter(prefix="/api/v1/events", tags=["events"])


@router.get("/", response_model=list[EventRead])
async def list_events(current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(
            select(CTFEvent).order_by(CTFEvent.created_at.desc())
        )
        return result.scalars().all()


@router.get("/active")
async def get_active_event():
    event = await CTFService.get_active_event()
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No active event")
    async with async_session_factory() as session:
        participants_result = await session.execute(
            select(EventParticipant).where(EventParticipant.event_id == event.id)
        )
        participants = participants_result.scalars().all()
        return {
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "start_at": event.start_at.isoformat() if event.start_at else None,
            "end_at": event.end_at.isoformat() if event.end_at else None,
            "status": event.status,
            "max_team_size": event.max_team_size,
            "isolation_mode": event.isolation_mode,
            "participants": [
                {
                    "team_id": str(p.team_id),
                    "instance_id": p.instance_id,
                    "instance_status": p.instance_status,
                }
                for p in (participants or [])
            ],
        }


@router.post("/", response_model=EventRead, status_code=status.HTTP_201_CREATED)
async def create_event(
    body: EventCreate,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        event = CTFEvent(**body.model_dump())
        session.add(event)
        await session.commit()
        await session.refresh(event)
        return event


@router.get("/{event_id}")
async def get_event(event_id: uuid.UUID, current_user: User = Depends(get_current_user)):
    async with async_session_factory() as session:
        result = await session.execute(
            select(CTFEvent)
            .options(selectinload(CTFEvent.participants))
            .where(CTFEvent.id == event_id)
        )
        event = result.scalar_one_or_none()
        if event is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        return {
            "id": str(event.id),
            "name": event.name,
            "description": event.description,
            "start_at": event.start_at.isoformat() if event.start_at else None,
            "end_at": event.end_at.isoformat() if event.end_at else None,
            "status": event.status,
            "max_team_size": event.max_team_size,
            "isolation_mode": event.isolation_mode,
            "participants": [
                {
                    "team_id": str(p.team_id),
                    "instance_id": p.instance_id,
                    "instance_status": p.instance_status,
                }
                for p in (event.participants or [])
            ],
            "created_at": event.created_at.isoformat(),
        }


@router.post("/{event_id}/start")
async def start_event(
    event_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    event = await CTFService.start_event(str(event_id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return {"detail": "Event started", "status": event.status, "start_at": event.start_at.isoformat()}


@router.post("/{event_id}/end")
async def end_event(
    event_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    event = await CTFService.end_event(str(event_id))
    if event is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
    return {"detail": "Event ended", "status": event.status, "end_at": event.end_at.isoformat()}


@router.post("/{event_id}/register")
async def register_for_event(
    event_id: uuid.UUID,
    team_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
):
    async with async_session_factory() as session:
        event_result = await session.execute(select(CTFEvent).where(CTFEvent.id == event_id))
        event = event_result.scalar_one_or_none()
        if event is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        if event.status != "pending":
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Event is not open for registration")
        existing = await session.execute(
            select(EventParticipant).where(
                EventParticipant.event_id == event_id,
                EventParticipant.team_id == team_id,
            )
        )
        if existing.scalar_one_or_none():
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Team already registered")
        participant = EventParticipant(event_id=event.id, team_id=team_id)
        session.add(participant)
        await session.commit()
        return {"detail": "Registered for event successfully"}


@router.delete("/{event_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_event(
    event_id: uuid.UUID,
    current_user: User = Depends(require_admin),
):
    async with async_session_factory() as session:
        result = await session.execute(select(CTFEvent).where(CTFEvent.id == event_id))
        event = result.scalar_one_or_none()
        if event is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Event not found")
        await session.delete(event)
        await session.commit()
