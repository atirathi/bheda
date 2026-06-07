import uuid
from datetime import datetime

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.models.base import Base, TimestampMixin


class Team(TimestampMixin, Base):
    __tablename__ = "teams"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    name: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    invite_code: Mapped[str] = mapped_column(String(32), unique=True, nullable=False)
    avatar_url: Mapped[str | None] = mapped_column(String(512), nullable=True)

    owner = relationship("User", foreign_keys=[owner_id], lazy="selectin")
    members = relationship("TeamMember", back_populates="team", lazy="selectin", cascade="all, delete-orphan")

    # Reject `avatar_url` schemes other than http(s) at the DB level
    # so a stray `javascript:`, `data:`, or `vbscript:` URI can't
    # sneak past application-level validation.  Application-level
    # validation is still the primary defense — this is a backstop.
    __table_args__ = (
        CheckConstraint(
            "avatar_url IS NULL OR avatar_url ~ '^https?://'",
            name="team_avatar_url_scheme",
        ),
    )


class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True
    )
    team_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("teams.id"), nullable=False
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(16), default="member", nullable=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    team = relationship("Team", back_populates="members")
    user = relationship("User", back_populates="teams")

    __table_args__ = (
        # `role` is constrained to "captain" or "member" so a stray
        # `UserUpdate.role` typo can't elevate someone to "superadmin".
        CheckConstraint(
            "role IN ('captain', 'member')",
            name="team_member_role_enum",
        ),
        # One row per (team, user).  The application code does a
        # pre-check, but two concurrent join requests for the same
        # user can both pass that check (TOCTOU) and both insert.
        # The unique constraint is the only race-free backstop —
        # the second commit fails with IntegrityError, which the
        # router surfaces as a 409.  Also makes membership queries
        # index-only.
        UniqueConstraint("team_id", "user_id", name="uq_team_members_team_user"),
    )
