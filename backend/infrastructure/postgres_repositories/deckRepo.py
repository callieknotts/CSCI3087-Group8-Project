from infrastructure.models.deckmodel import DeckModel
from entity.repo.deckRepo import DeckRepository
from entity.deck import Deck
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from datetime import datetime, timezone

class PostgresDeckRepository(DeckRepository):
    def __init__(self, session: Session):
        self.session = session

    def _to_model(self, deck: Deck):
        return DeckModel(
            id=deck.id,
            user_id=deck.user_id,
            description=deck.description,
            deckname=deck.deckname,
            created_at=deck.created_at,
            last_opened_at=deck.last_opened_at,
            visibility=deck.visibility
        )

    def _to_domain(self, deck: DeckModel):
        return Deck(
            id=deck.id,
            user_id=deck.user_id,
            description=deck.description,
            deckname=deck.deckname,
            created_at=deck.created_at,
            last_opened_at=deck.last_opened_at,
            visibility=deck.visibility
        )

    def add(self, deck: Deck):
        model = self._to_model(deck)
        self.session.add(model)
        self.session.commit()
        return deck

    def get(self, user_id, deck_id) -> Deck | None:
        stmt = (
            select(DeckModel)
            .where(DeckModel.user_id == user_id)
            .where(DeckModel.id == deck_id)
        )
        model = self.session.scalar(stmt)
        if model is None:
            return None
        # makes this not into just a get function!
        #currently this implementation is fine unless otherwise
        #----------------------------------------------------
        model.last_opened_at = datetime.now(timezone.utc)

        self.session.commit()
        self.session.refresh(model)
        #----------------------------------------------------

        return self._to_domain(model)
    # def get_all(self, user_id):
    #         models = self.session.select(DeckModel).where()
    #         return [
    #             self._to_domain(m) for m in models
    #         ]

    
    def get_all(self, user_id, sort="last_opened_at", order="desc"):

        allowed_sorts = {
            "created_at": DeckModel.created_at,
            "deckname": DeckModel.deckname,
            "last_opened_at": DeckModel.last_opened_at
        }

        sort_column = allowed_sorts.get(sort)

        if sort_column is None:
            raise ValueError("Invalid sort field")

        if order not in ("asc", "desc"):
            raise ValueError("Invalid sort order")

        stmt = select(DeckModel).where(
            DeckModel.user_id == user_id
        )

        sort_expression = (
            sort_column.asc() if order == "asc"
            else sort_column.desc()
        )

        stmt = stmt.order_by(
            sort_expression,
            DeckModel.id.asc()
        )

        models = self.session.scalars(stmt).all()

        return [self._to_domain(m) for m in models]

    def save(self, deck: Deck) -> Deck:
        """Explicitly update an existing Deck record."""
        model = model = self.session.execute(
            select(DeckModel).where(
                DeckModel.user_id == deck.user_id,
                DeckModel.id == deck.id
            )
        ).scalar_one_or_none()

        if not model:
            raise ValueError(f"deck with id {deck.id} not found for update.")

        model.id = deck.id
        model.user_id = deck.user_id
        model.deckname = deck.deckname

        model.description = deck.description
        model.created_at = deck.created_at
        model.last_opened_at = datetime.now(timezone.utc)
        self.session.commit()
        return self._to_domain(model)

    def delete(self, deck_id, user_id):
        stmt = (
            delete(DeckModel)
            .where(DeckModel.id == deck_id)
            .where(DeckModel.user_id == user_id)
        )
        result = self.session.execute(stmt)
        self.session.commit()
        return result
        # this is not needed now but maybe if we limit num of decks
        # return result.rowcount > 0

    def exists_by_name(self, user_id, deckname):
        stmt = select(DeckModel).where(DeckModel.user_id == user_id
                                       ).where(DeckModel.deckname == deckname
                                               )
        return self.session.scalar(stmt) is not None
