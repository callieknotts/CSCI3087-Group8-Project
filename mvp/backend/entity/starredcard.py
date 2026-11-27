from dataclasses import dataclass
from datetime import datetime, timezone
from uuid import UUID, uuid4


@dataclass
class StarredCard:
    """A card one user has starred. Stars belong to the user, not the card."""
    id: UUID
    user_id: UUID
    card_id: UUID
    created_at: datetime

    @classmethod
    def create(cls, user_id: UUID, card_id: UUID) -> "StarredCard":
        return cls(
            id=uuid4(),
            user_id=user_id,
            card_id=card_id,
            created_at=datetime.now(timezone.utc)
        )
