from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import uuid4, UUID
from entity.cardcontent import CardContent

@dataclass
class Card:
    id: UUID
    deck_id: UUID
    subdeck_id: UUID | None
    content: CardContent
    position: int
    created_at: datetime
    updated_at: datetime

    @classmethod
    def create(
        cls,
        deck_id: UUID,
        content: CardContent,
        position: int,
        subdeck_id: UUID | None = None
    ) -> "Card":

        now = datetime.now(timezone.utc)

        if position < 0:
            raise ValueError("Position cannot be negative")

        return cls(
            id=uuid4(),
            deck_id=deck_id,
            subdeck_id=subdeck_id,
            content=content,
            position=position,
            created_at=now,
            updated_at=now
        )