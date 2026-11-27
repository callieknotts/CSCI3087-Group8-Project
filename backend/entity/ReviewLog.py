
from dataclasses import dataclass
from uuid import UUID, uuid4
from datetime import datetime, timezone
from enum import Enum


class Rating(Enum):
    AGAIN = "again"
    HARD = "hard"
    GOOD = "good"
    EASY = "easy"


@dataclass
class CardReviewState:
    id: UUID
    user_id: UUID
    card_id: UUID
    rating: Rating
    reviewed_at: datetime
    previous_interval: float
    next_interval: float

    @classmethod
    def create(
        cls,
        user_id: UUID,
        card_id: UUID,
        rating: Rating,
        previous_interval: float,
        next_interval: float,
        reviewed_at: datetime | None = None
    ) -> "CardReviewState":

        return cls(
            id=uuid4(),
            user_id=user_id,
            card_id=card_id,
            rating=rating,
            reviewed_at=reviewed_at or datetime.now(timezone.utc),
            previous_interval=previous_interval,
            next_interval=next_interval
        )
