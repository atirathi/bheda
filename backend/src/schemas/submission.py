import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SubmissionCreate(BaseModel):
    challenge_id: uuid.UUID
    # CTF flags are typically < 100 chars. Cap at 256 to keep the
    # double-SHA256 on every submit fast and bounded.
    flag: str = Field(..., min_length=1, max_length=256)
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
