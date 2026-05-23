import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EventCreate(BaseModel):
    name: str = Field(..., max_length=256)
    description: str | None = None
    start_at: datetime | None = None
    end_at: datetime | None = None
    max_team_size: int = 5
    isolation_mode: bool = False


class EventStart(BaseModel):
    action: str = "start"


class EventRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    start_at: datetime | None
    end_at: datetime | None
    max_team_size: int
    isolation_mode: bool
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
