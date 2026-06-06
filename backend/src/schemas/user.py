import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=64)
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    # `username` is the historical field. We also accept `email` to match
    # the frontend form. The router below resolves whichever is present.
    username: str | None = Field(None, min_length=3, max_length=64)
    email: EmailStr | None = None
    password: str = Field(..., min_length=1, max_length=256)
    mfa_code: str | None = Field(None, min_length=6, max_length=10)

    def resolved_login(self) -> str:
        # Prefer email; fall back to username. Reject if neither is supplied.
        if self.email:
            return self.email
        if self.username:
            return self.username
        raise ValueError("email or username is required")


class UserUpdate(BaseModel):
    email: EmailStr | None = None
    username: str | None = Field(None, min_length=3, max_length=64)
    is_active: bool | None = None
    is_banned: bool | None = None
    role: str | None = None


class UserRead(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    role: str
    is_banned: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
