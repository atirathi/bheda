import uuid
from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator

# Whitelist of top-level keys allowed inside a profile `config` blob.
# Sub-keys are validated when the profile is applied (see
# `profile_service.apply_profile`). This top-level whitelist keeps
# random metadata like `__proto__` or admin-only fields out of the DB.
_ALLOWED_CONFIG_KEYS = frozenset({
    "challenges",
    "categories",
    "metadata",
})


class ProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    description: str | None = Field(None, max_length=512)
    # Cap the config blob to 64KB to keep JSONB writes bounded.
    config: dict[str, Any] = Field(default_factory=dict, max_length=65_536)

    @field_validator("config")
    @classmethod
    def _validate_config_keys(cls, v: dict[str, Any]) -> dict[str, Any]:
        unknown = set(v.keys()) - _ALLOWED_CONFIG_KEYS
        if unknown:
            raise ValueError(
                f"config may only contain keys: {sorted(_ALLOWED_CONFIG_KEYS)} "
                f"(got: {sorted(unknown)})"
            )
        return v


class ProfileRead(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
