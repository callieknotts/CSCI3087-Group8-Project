import uuid
from datetime import datetime

from sqlalchemy import (
    String,
    DateTime,
    ForeignKey,
    func,
    Enum as SAEnum
)
from sqlalchemy.orm import Mapped, mapped_column

from infrastructure.database import Base
from entity.deck import Visibility


class DeckModel(Base):
    __tablename__ = "decks"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )

    deckname: Mapped[str] = mapped_column(
        String,
        nullable=False
    )

    description: Mapped[str | None] = mapped_column(
        String,
        nullable=True
    )

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id",ondelete="CASCADE"), #very important need cascade when deleting decks
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    last_opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    visibility: Mapped[Visibility] = mapped_column(
        SAEnum(
            Visibility,
            values_callable=lambda enum: [e.value for e in enum],
            native_enum=False,
            length=20
        ),
        nullable=False,
        default=Visibility.PRIVATE,
        server_default=Visibility.PRIVATE.value
    )