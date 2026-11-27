
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Float,
    Integer,
    DateTime,
    ForeignKey,
    UniqueConstraint,
    Index,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database import Base


class ReviewStateModel(Base):
    __tablename__ = "review_states"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "card_id",
            name="uq_review_state_user_card"
        ),
        Index("ix_review_states_user_due", "user_id", "due_at"),
    )

    id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4
    )

    user_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    card_id: Mapped[UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("cards.id", ondelete="CASCADE"),
        nullable=False
    )

    repetitions: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    ease_factor: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=2.5
    )

    interval_days: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )

    due_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    last_reviewed_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )

    lapses: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    learning_step: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )
