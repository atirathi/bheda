import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    challenge_id: uuid.UUID
    flag: str
    team_id: uuid.UUID | None = None


class SubmissionRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    team_id: uuid.UUID | None
    challenge_id: uuid.UUID
    correct: bool
    ip_address: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
