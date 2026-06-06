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
    flag_hash: str = Field(..., max_length=256)
    points: int = Field(100, ge=0, le=1_000_000)


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
    # `flag_hash` deliberately omitted from the public read schema.
    # It is the SHA-256 digest of the real flag, and exposing it (even
    # as a hash) lets a skilled attacker crack weak CTF flags offline
    # or pre-compute rainbow tables for the common "BHEDA{word}"
    # formats used in this platform.  Admin-only reads go through
    # `ChallengeAdminRead` below.
    points: int
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ChallengeAdminRead(ChallengeRead):
    """Schema used for admin-only listings — includes flag_hash."""

    flag_hash: str


class ChallengeToggle(BaseModel):
    enabled: bool | None = None
    waf_enabled: bool | None = None
    hint_enabled: bool | None = None
