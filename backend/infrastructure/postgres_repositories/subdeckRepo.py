from infrastructure.models.subdeckmodel import SubDeckModel
from entity.repo.subdeckRepo import SubDeckRepository
from entity.subdeck import SubDeck
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
    # id: UUID
    # user_id: UUID
    # deck_id: UUID
    # subdeckname:str
    # created_at: datetime
class PostgresSubDeckRepository(SubDeckRepository):
    def __init__(self, session: Session):
        self.session=session

    def _to_model(self,subdeck:SubDeck):
        return SubDeckModel(
            id=subdeck.id,
            user_id=subdeck.user_id,
            deck_id= subdeck.deck_id,
            subdeckname=subdeck.subdeckname,
            created_at=subdeck.created_at
        )
    def _to_domain(self,subdeck:SubDeckModel):
            return SubDeck(
                id=subdeck.id,
                user_id=subdeck.user_id,
                deck_id= subdeck.deck_id,
                subdeckname=subdeck.subdeckname,
                created_at=subdeck.created_at
            )
    def add(self, subdeck:SubDeck):
        model = self._to_model(subdeck)
        self.session.add(model)
        self.session.commit()
        return subdeck
    def get(self, subdeck_id, deck_id, user_id):
        stmt = (
                     select(SubDeckModel)
                     .where(SubDeckModel.user_id==user_id
                            ).where(SubDeckModel.deck_id==deck_id
                                    ).where(SubDeckModel.id==subdeck_id)
                )
        return self.session.scalar(stmt)
    # def get_all(self, user_id):
    #         models = self.session.select(DeckModel).where()
    #         return [
    #             self._to_domain(m) for m in models
    #         ]
    def get_all(self, user_id,deck_id):
             # 1. Create a decoupled SQL statement
        stmt = select(SubDeckModel).where(SubDeckModel.user_id == user_id).where(SubDeckModel.deck_id == deck_id)
        
        # 2. scalars().all() extracts the DeckModel objects directly from the rows
        models = self.session.scalars(stmt).all()
        
        return [self._to_domain(m) for m in models]
    def save(self, subdeck: SubDeck) -> SubDeck:
            """Explicitly update an existing Deck record."""
            model = self.session.get(SubDeckModel, subdeck.id)
            if not model:
                raise ValueError(f"deck with id {subdeck.id} not found for update.")
            
            model.id = subdeck.id
            model.user_id=subdeck.user_id
            model.subdeckname = subdeck.subdeckname
            model.description = subdeck.description
            model.created_at = subdeck.created_at
            # model.updated_at = deck.updated_at
            self.session.commit()
            return subdeck
    

    def delete(self, user_id,deck_id, subdeck_id):
        stmt = (
             delete(SubDeckModel)
             .where(SubDeckModel.user_id==user_id)
             .where(SubDeckModel.deck_id==deck_id)
             .where(SubDeckModel.id==subdeck_id)
             
        )
        result = self.session.execute(stmt)
        self.session.commit()
        return result
        # this is not needed now but maybe if we limit num of decks
        # return result.rowcount > 0

         
    def exists_by_name(self,user_id,deck_id,subdeckname):
        stmt = select(SubDeckModel).where(SubDeckModel.user_id == user_id
                                ).where(SubDeckModel.deck_id == deck_id
                                        ).where(SubDeckModel.subdeckname==subdeckname)
        return self.session.scalar(stmt) is not None
    
         

         
        
