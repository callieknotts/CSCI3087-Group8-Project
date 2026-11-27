
from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict

from entity.ReviewLog import Rating


class SubmitReviewRequest(BaseModel):
    rating: Rating


class ReviewStateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    card_id: UUID

    repetitions: int
    ease_factor: float
    interval_days: float

    due_at: datetime | None
    last_reviewed_at: datetime | None

    lapses: int
    learning_step: int


class DueCardsResponse(BaseModel):
    cards: list[ReviewStateResponse]


class ReviewLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    card_id: UUID
    rating: Rating

    reviewed_at: datetime
    previous_interval: float
    next_interval: float
