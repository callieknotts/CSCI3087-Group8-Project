
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.orm import Session

from entity.ReviewLog import ReviewLog
from entity.repo.reviewlogRepo import ReviewLogRepository
from infrastructure.models.reviewlogmodel import ReviewLogModel


class PostgresReviewLogRepository(ReviewLogRepository):

    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _to_entity(model: ReviewLogModel) -> ReviewLog:
        return ReviewLog(
            id=model.id,
            user_id=model.user_id,
            card_id=model.card_id,
            rating=model.rating,
            reviewed_at=model.reviewed_at,
            previous_interval=model.previous_interval,
            next_interval=model.next_interval
        )

    def get(self, log_id: UUID) -> ReviewLog | None:

        model = self.session.get(ReviewLogModel, log_id)

        if model is None:
            return None

        return self._to_entity(model)

    def get_by_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> list[ReviewLog]:

        statement = (
            select(ReviewLogModel)
            .where(
                ReviewLogModel.user_id == user_id,
                ReviewLogModel.card_id == card_id
            )
            .order_by(ReviewLogModel.reviewed_at.desc())
        )

        models = self.session.scalars(statement).all()

        return [self._to_entity(model) for model in models]

    def get_all(self, user_id: UUID) -> list[ReviewLog]:

        statement = (
            select(ReviewLogModel)
            .where(ReviewLogModel.user_id == user_id)
            .order_by(ReviewLogModel.reviewed_at.desc())
        )

        models = self.session.scalars(statement).all()

        return [self._to_entity(model) for model in models]

    def add(self, log: ReviewLog) -> ReviewLog:

        model = ReviewLogModel(
            id=log.id,
            user_id=log.user_id,
            card_id=log.card_id,
            rating=log.rating,
            reviewed_at=log.reviewed_at,
            previous_interval=log.previous_interval,
            next_interval=log.next_interval
        )

        self.session.add(model)
        self.session.flush()

        return self._to_entity(model)
