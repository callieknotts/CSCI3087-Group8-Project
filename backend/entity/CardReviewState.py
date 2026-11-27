
from dataclasses import dataclass
from uuid import UUID, uuid4
from datetime import datetime, timezone


@dataclass
class CardReviewState:
    id: UUID
    user_id: UUID
    card_id: UUID
    repetitions: int
    ease_factor: float
    interval_days: float
    due_at: datetime
    last_reviewed_at: datetime
    lapses: int
    learning_step: int

    @classmethod
    def create(
        cls,
        user_id: UUID,
        card_id: UUID,
        repetitions: int = 0,
        ease_factor: float = 2.5,
        interval_days: float = 0.0,
        due_at: datetime | None = None,
        last_reviewed_at: datetime | None = None,
        lapses: int = 0,
        learning_step: int = 0
    ) -> "CardReviewState":

        now = datetime.now(timezone.utc)

        return cls(
            id=uuid4(),
            user_id=user_id,
            card_id=card_id,
            repetitions=repetitions,
            ease_factor=ease_factor,
            interval_days=interval_days,
            due_at=due_at or now,
            last_reviewed_at=last_reviewed_at or now,
            lapses=lapses,
            learning_step=learning_step
        )
