import uuid
from datetime import datetime

from sqlalchemy import UUID as SQLAlchemyUUID, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column

from backend.infrastructure.database import Base


class DeckModel(Base):
    __tablename__ = "decks"

    id: Mapped[uuid.UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        primary_key=True,
        nullable=False,
    )

    deckname: Mapped[str] = mapped_column(nullable=False)

    description: Mapped[str | None] = mapped_column(nullable=True)

    user_id: Mapped[uuid.UUID] = mapped_column(
        SQLAlchemyUUID(as_uuid=True),
        ForeignKey("users.id"),  # Verify the actual table name
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        nullable=False    
        )