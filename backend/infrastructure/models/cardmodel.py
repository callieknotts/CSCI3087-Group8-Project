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
from sqlalchemy import UUID as SQLAlchemyUUID, ForeignKey, Text

from infrastructure.database import Base


class CardModel(Base):
    __tablename__ = "cards"

    id: Mapped[uuid.UUID] = mapped_column(
        primary_key=True,
        default=uuid.uuid4,
        nullable=False
    )
    deck_id: Mapped[uuid.UUID] = mapped_column(
            SQLAlchemyUUID(as_uuid=True),
            ForeignKey("decks.id",ondelete="CASCADE"),  # very important! need cascade to delete all cards when deleted
            nullable=False,
        )
    subdeck_id: Mapped[uuid.UUID| None] = mapped_column(
                SQLAlchemyUUID(as_uuid=True),
                ForeignKey("subdecks.id"), 
                nullable=True,
            )
    created_at: Mapped[datetime] = mapped_column(
            DateTime(timezone=True),
            server_default=func.now(),
            nullable=False
        )
    updated_at: Mapped[datetime] = mapped_column(
                DateTime(timezone=True),
                server_default=func.now(),
                nullable=False
            )
    position: Mapped[int]= mapped_column(
        nullable=False
        )
    
    front_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    front_image_key: Mapped[str | None] = mapped_column(Text, nullable=True)

    back_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    back_image_key: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    
    

#     deckname: Mapped[str] = mapped_column(
#         String,
#         nullable=False
#     )

#     description: Mapped[str | None] = mapped_column(
#         String,
#         nullable=True
#     )



    

#     last_opened_at: Mapped[datetime] = mapped_column(
#         DateTime(timezone=True),
#         server_default=func.now(),
#         nullable=False
#     )

#     visibility: Mapped[Visibility] = mapped_column(
#         SAEnum(
#             Visibility,
#             values_callable=lambda enum: [e.value for e in enum],
#             native_enum=False,
#             length=20
#         ),
#         nullable=False,
#         default=Visibility.PRIVATE,
#         server_default=Visibility.PRIVATE.value
#     )