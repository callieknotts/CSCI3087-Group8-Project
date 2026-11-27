
import uuid

from datetime import datetime
from enum import Enum

from sqlalchemy import (
    DateTime,
    Float,
    ForeignKey,
    Enum as SQLAlchemyEnum,
    func,
    Index
)
from sqlalchemy.dialects.postgresql import UUID as SQLAlchemyUUID
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database import Base
from entity.ReviewLog import Rating


class ReviewLogModel(Base):
    __tablename__ = "review_logs"

    __table_args__ = (
        Index("ix_review_logs_user_reviewed", "user_id", "reviewed_at"),
        Index("ix_review_logs_card_reviewed", "card_id", "reviewed_at"),
    )

    id: Mapped[uuid.UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )

    card_id: Mapped[uuid.UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("cards.id", ondelete="CASCADE"),
        nullable=False
    )

    rating: Mapped[Rating] = mapped_column(
        SQLAlchemyEnum(
            Rating,
            name="review_rating",
            values_callable=lambda enum: [item.value for item in enum]
        ),
        nullable=False
    )

    reviewed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    previous_interval: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )

    next_interval: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
