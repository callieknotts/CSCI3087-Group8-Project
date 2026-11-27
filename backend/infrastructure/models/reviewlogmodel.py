
from datetime import datetime, timezone
from uuid import uuid4

from sqlalchemy import (
    Float,
    DateTime,
    ForeignKey,
    Index,
    Enum as SQLAlchemyEnum,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database import Base
from entity.ReviewLog import Rating


class ReviewLogModel(Base):
    __tablename__ = "review_logs"

    __table_args__ = (
        Index(
            "ix_review_logs_user_card_reviewed",
            "user_id",
            "card_id",
            "reviewed_at"
        ),
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

    rating: Mapped[Rating] = mapped_column(
        SQLAlchemyEnum(Rating, name="review_rating"),
        nullable=False
    )

    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )

    previous_interval: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )

    next_interval: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc)
    )
