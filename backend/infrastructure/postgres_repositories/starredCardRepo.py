from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from entity.repo.starredcardRepo import StarredCardRepository
from entity.starredcard import StarredCard
from infrastructure.models.cardmodel import CardModel
from infrastructure.models.deckmodel import DeckModel
from infrastructure.models.starredcardmodel import StarredCardModel


class PostgresStarredCardRepository(StarredCardRepository):

    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _to_entity(model: StarredCardModel) -> StarredCard:
        return StarredCard(
            id=model.id,
            user_id=model.user_id,
            card_id=model.card_id,
            created_at=model.created_at
        )

    def card_owned_by_user(self, user_id: UUID, card_id: UUID) -> bool:
        # A plain join, on purpose: DeckRepository.get also bumps the deck's
        # last_opened_at and commits, which starring a card must not do.
        statement = (
            select(CardModel.id)
            .join(DeckModel, CardModel.deck_id == DeckModel.id)
            .where(
                CardModel.id == card_id,
                DeckModel.user_id == user_id
            )
        )

        return self.session.scalar(statement) is not None

    def get_by_user_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> StarredCard | None:

        statement = select(StarredCardModel).where(
            StarredCardModel.user_id == user_id,
            StarredCardModel.card_id == card_id
        )

        model = self.session.scalars(statement).first()

        if model is None:
            return None

        return self._to_entity(model)

    def get_all(self, user_id: UUID) -> list[StarredCard]:

        statement = (
            select(StarredCardModel)
            .where(StarredCardModel.user_id == user_id)
            .order_by(
                StarredCardModel.created_at.asc(),
                StarredCardModel.id.asc()
            )
        )

        models = self.session.scalars(statement).all()

        return [self._to_entity(model) for model in models]

    def add(self, star: StarredCard) -> StarredCard:

        model = StarredCardModel(
            id=star.id,
            user_id=star.user_id,
            card_id=star.card_id,
            created_at=star.created_at
        )

        self.session.add(model)
        self.session.flush()

        return self._to_entity(model)

    def delete_by_user_card(self, user_id: UUID, card_id: UUID) -> bool:

        result = self.session.execute(
            delete(StarredCardModel).where(
                StarredCardModel.user_id == user_id,
                StarredCardModel.card_id == card_id
            )
        )

        self.session.flush()

        return result.rowcount > 0
