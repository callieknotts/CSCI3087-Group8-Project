
from uuid import UUID
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.orm import Session

from entity.CardReviewState import CardReviewState
from entity.repo.cardreviewstateRepo import CardReviewStateRepository
from infrastructure.models.reviewstatemodel import ReviewStateModel


class PostgresCardReviewStateRepository(CardReviewStateRepository):

    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _to_entity(model: ReviewStateModel) -> CardReviewState:
        return CardReviewState(
            id=model.id,
            user_id=model.user_id,
            card_id=model.card_id,
            repetitions=model.repetitions,
            ease_factor=model.ease_factor,
            interval_days=model.interval_days,
            due_at=model.due_at,
            last_reviewed_at=model.last_reviewed_at,
            lapses=model.lapses,
            learning_step=model.learning_step
        )

    def get(self, state_id: UUID) -> CardReviewState | None:
        model = self.session.get(ReviewStateModel, state_id)

        if model is None:
            return None

        return self._to_entity(model)

    def get_by_user_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> CardReviewState | None:

        statement = select(ReviewStateModel).where(
            ReviewStateModel.user_id == user_id,
            ReviewStateModel.card_id == card_id
        )

        model = self.session.scalars(statement).first()

        if model is None:
            return None

        return self._to_entity(model)

    def get_due_cards(
        self,
        user_id: UUID
    ) -> list[CardReviewState]:

        statement = select(ReviewStateModel).where(
            ReviewStateModel.user_id == user_id,
            ReviewStateModel.due_at <= datetime.now(timezone.utc)
        ).order_by(ReviewStateModel.due_at.asc())

        models = self.session.scalars(statement).all()

        return [self._to_entity(model) for model in models]

    def get_all(self, user_id: UUID) -> list[CardReviewState]:

        statement = select(ReviewStateModel).where(
            ReviewStateModel.user_id == user_id
        )

        models = self.session.scalars(statement).all()

        return [self._to_entity(model) for model in models]

    def add(self, state: CardReviewState) -> CardReviewState:

        model = ReviewStateModel(
            id=state.id,
            user_id=state.user_id,
            card_id=state.card_id,
            repetitions=state.repetitions,
            ease_factor=state.ease_factor,
            interval_days=state.interval_days,
            due_at=state.due_at,
            last_reviewed_at=state.last_reviewed_at,
            lapses=state.lapses,
            learning_step=state.learning_step
        )

        self.session.add(model)
        self.session.flush()

        return self._to_entity(model)

    def update(self, state: CardReviewState) -> CardReviewState:

        model = self.session.get(ReviewStateModel, state.id)

        if model is None:
            raise ValueError("Review state not found")

        model.repetitions = state.repetitions
        model.ease_factor = state.ease_factor
        model.interval_days = state.interval_days
        model.due_at = state.due_at
        model.last_reviewed_at = state.last_reviewed_at
        model.lapses = state.lapses
        model.learning_step = state.learning_step

        self.session.flush()

        return self._to_entity(model)

    def delete(self, state_id: UUID) -> None:

        model = self.session.get(ReviewStateModel, state_id)

        if model is None:
            return

        self.session.delete(model)
        self.session.flush()
