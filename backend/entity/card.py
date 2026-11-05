from dataclasses import dataclass
from datetime import datetime
from uuid import uuid4, UUID
from enum import Enum


class CardType(str, Enum):
    BASIC = "basic"
    # CLOZE = "cloze"
    # MATH = "math"
    # LANGUAGE = "language"
    # IMAGE_OCCLUSION = "image_occlusion"
    # MULTIPLE_CHOICE = "multiple_choice"


@dataclass
class Card:
    id: UUID
    deck_id: UUID
    subdeck_id: UUID | None
    card_type: CardType
    content: dict
    created_at: datetime
    updated_at: datetime

    @classmethod
    def create(cls,
               deck_id: UUID,
               subdeck_id: UUID | None,
               card_type: CardType,
               content: dict
               ) -> "Card":
        return (cls(
            id=uuid4(),
            deck_id=deck_id,
            subdeck_id=subdeck_id,
            card_type=card_type,
            content=content,
            created_at=datetime.now(),
            updated_at=datetime.now()
        ))
