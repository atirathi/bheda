import re
import uuid
from datetime import datetime

from pydantic import BaseModel, Field, field_validator

# Hex color matcher for Category.color — `#RGB` or `#RRGGBB`.
_HEX_COLOR = re.compile(r"^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$")


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=128)
    icon: str | None = Field(None, max_length=64)
    color: str | None = Field(None, max_length=16)
    sort_order: int = Field(0, ge=0, le=10_000)
    description: str | None = Field(None, max_length=512)

    @field_validator("color")
    @classmethod
    def _validate_color(cls, v: str | None) -> str | None:
        if v is not None and not _HEX_COLOR.match(v):
            raise ValueError("color must be a hex string like '#ff00aa' or '#f0a'")
        return v


class CategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    icon: str | None
    color: str | None
    sort_order: int
    enabled: bool
    description: str | None
    challenge_count: int = 0
    created_at: datetime

    model_config = {"from_attributes": True}
