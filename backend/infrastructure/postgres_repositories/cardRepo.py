from infrastructure.models.cardmodel import CardModel
from infrastructure.models.deckmodel import DeckModel
from infrastructure.models.subdeckmodel import SubDeckModel
from entity.repo.cardRepo import CardRepository


from entity.card import Card
from entity.cardcontent import CardContent, CardSide
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from datetime import datetime, timezone
from uuid import UUID
class PostgresCardRepository(CardRepository):
    def __init__(self, session: Session):
        self.session = session

    def _to_model(self, card: Card):
        return CardModel(
            id=card.id,
            deck_id=card.deck_id,
            subdeck_id=card.subdeck_id,
            created_at=card.created_at,
            updated_at=card.updated_at,
            position=card.position,
            front_text=card.content.front.text,
            front_image_key=card.content.front.image_key,
            back_text=card.content.back.text,
            back_image_key=card.content.back.image_key,
            
        )

    def _to_domain(self, card: CardModel):
        content = CardContent(
            front=CardSide(
                text=card.front_text,
                image_key=card.front_image_key,
            ),
            back=CardSide(
                text=card.back_text,
                image_key=card.back_image_key,
            )
        )
        return Card(
            id=card.id,
            deck_id=card.deck_id,
            subdeck_id=card.subdeck_id,
            created_at=card.created_at,
            updated_at=card.updated_at,
            position=card.position,
            content=content
        )
    def get(self,deck_id,card_id):
        stmt= (select(CardModel)
               .where(CardModel.deck_id == deck_id)
               .where(CardModel.id==card_id))
        model = self.session.scalar(stmt)
        if model is None:
            return None
        return self._to_domain(model)

    def save(self, card: Card):
        model = self.session.get(CardModel, card.id)

        if model is None:
            return None

    def delete(self, user_id: UUID, deck_id: UUID, card_id: UUID):
        stmt = (
            select(CardModel)
            .join(DeckModel, CardModel.deck_id == DeckModel.id)
            .where(
                CardModel.id == card_id,
                CardModel.deck_id == deck_id,
                DeckModel.user_id == user_id
            )
        )

        model = self.session.scalar(stmt)

        if model is None:
            return False

        self.session.delete(model)
        self.session.commit()

        return True
    
    def get_all_by_deck(self, deck_id: UUID):

        stmt = (
            select(CardModel)
            .outerjoin(
                SubDeckModel,
                CardModel.subdeck_id == SubDeckModel.id
            )
            .where(CardModel.deck_id == deck_id)
            .order_by(
                SubDeckModel.subdeckname.asc().nulls_last(),
                CardModel.position.asc(),
                CardModel.id.asc()
            )
        )

        models = self.session.scalars(stmt).all()

        return [self._to_domain(model) for model in models]

    def get_all_by_subdeck(self, deck_id: UUID, subdeck_id: UUID):
        stmt = (
            select(CardModel)
            .where(CardModel.deck_id == deck_id)
            .where(CardModel.subdeck_id == subdeck_id)
            .order_by(
                CardModel.position.asc(),
                CardModel.id.asc()
            )
        )

        models = self.session.scalars(stmt).all()

        return [self._to_domain(model) for model in models]


    def add(self,card:Card):
        model=self._to_model(card)
        self.session.add(model)
        self.session.commit()
        return card

#     stmt = (
#         select(CardModel)
#         .outerjoin(
#             SubDeckModel,
#             CardModel.subdeck_id == SubDeckModel.id
#         )
#         .where(CardModel.deck_id == deck_id)
#         .order_by(
#             SubDeckModel.subdeckname.asc().nulls_last(),
#             CardModel.position.asc(),
#             CardModel.id.asc()
#         )
#     )

#     models = self.session.scalars(stmt).all()

#     return [self._to_domain(model) for model in models]  

    # def get_all_subdeck(self,deck_id,subdeck_id):
    #     stmt= (select(CardModel)
    #             .where(CardModel.deck_id == deck_id)
    #             .where(CardModel.subdeck_id==subdeck_id))
    #     model = self.session.scalar(stmt)
    #     if model is None:
    #         return None
    #     return self._to_domain(model)
