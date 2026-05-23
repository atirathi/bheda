import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ChallengeCreate(BaseModel):
    category_id: uuid.UUID
    title: str = Field(..., max_length=256)
    description: str
    difficulty: str = "medium"
    cvss_score: float | None = None
    owasp_mapping: str | None = None
    real_cve: str | None = None
    endpoint: str | None = None
    enabled: bool = True
    waf_enabled: bool = False
    hint_enabled: bool = True
    max_attempts: int = 0
    requires: list | None = None
    metadata_: dict | None = None
    flag_hash: str
    points: int = 100


class ChallengeRead(BaseModel):
    id: uuid.UUID
    category_id: uuid.UUID
    title: str
    description: str
    difficulty: str
    cvss_score: float | None
    owasp_mapping: str | None
    real_cve: str | None
    endpoint: str | None
    enabled: bool
    waf_enabled: bool
    hint_enabled: bool
    max_attempts: int
    requires: list | None
    flag_hash: str
    points: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChallengeToggle(BaseModel):
    enabled: bool | None = None
    waf_enabled: bool | None = None
    hint_enabled: bool | None = None
