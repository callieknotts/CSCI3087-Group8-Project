from backend.infrastructure.models.deckmodel import DeckModel
from backend.entity.repo.deckRepo import DeckRepository
from backend.entity.deck import Deck
from sqlalchemy.orm import Session
from sqlalchemy import select, delete

class PostgresDeckRepository(DeckRepository):
    def __init__(self, session: Session):
        self.session=session

    def _to_model(self,deck:Deck):
        return DeckModel(
            id=deck.id,
            user_id=deck.user_id,
            description= deck.description,
            deckname=deck.deckname,
            created_at=deck.created_at
        )
    def _to_domain(self,deck:DeckModel):
            return Deck(
                id=deck.id,
                user_id=deck.user_id,
                description= deck.description,
                deckname=deck.deckname,
                created_at=deck.created_at
            )
    def add(self, deck:Deck):
        model = self._to_model(deck)
        self.session.add(model)
        self.session.commit()
        return deck
    def get(self, user_id,deck_id) -> Deck | None:
        stmt = (
                     select(DeckModel)
                     .where(DeckModel.id==deck_id)
                     .where(DeckModel.user_id==user_id)
                )
        return self.session.scalar(stmt)
    # def get_all(self, user_id):
    #         models = self.session.select(DeckModel).where()
    #         return [
    #             self._to_domain(m) for m in models
    #         ]
    def get_all(self, user_id):
             # 1. Create a decoupled SQL statement
        stmt = select(DeckModel).where(DeckModel.user_id == user_id)
        
        # 2. scalars().all() extracts the DeckModel objects directly from the rows
        models = self.session.scalars(stmt).all()
        
        return [self._to_domain(m) for m in models]
    def save(self, deck: Deck) -> Deck:
            """Explicitly update an existing Deck record."""
            model = self.session.get(DeckModel, deck.id)
            if not model:
                raise ValueError(f"deck with id {deck.id} not found for update.")
            
            model.id = deck.id
            model.user_id=deck.user_id
            model.deckname = deck.deckname
            model.description = deck.description
            model.created_at = deck.created_at
            # model.updated_at = deck.updated_at
            self.session.commit()
            return deck
    

    def delete(self, deck_id, user_id):
        stmt = (
             delete(DeckModel)
             .where(DeckModel.id==deck_id)
             .where(DeckModel.user_id==user_id)
        )
        result = self.session.execute(stmt)
        self.session.commit()
        return result
        # this is not needed now but maybe if we limit num of decks
        # return result.rowcount > 0

         
    def exists_by_name(self,user_id,deckname):
        stmt = select(DeckModel).where(DeckModel.user_id == user_id
                                ).where(DeckModel.deckname == deckname
                                        )
        return self.session.scalar(stmt) is not None

         
            
         

         
        
