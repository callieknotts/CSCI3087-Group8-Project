from uuid import UUID
from backend.entity.repo.deckRepo import DeckRepository
from backend.entity.deck import Deck
class UpdateDeck:
    def __init__(self, deck_repo: DeckRepository):
        self.deck_repo=deck_repo
    def execute(self,
                deck_id:UUID,
                user_id:UUID,
                new_deck_name:str,
                new_description: str |None,
                ):
            result = self.deck_repo.get(user_id=user_id,deck_id=deck_id)
            if not result:
                raise ValueError("does not exist")
            if result.user_id != user_id:
                 raise ValueError("User Authentication Error")
            
            if self.deck_repo.exists_by_name(user_id=result.user_id,deckname=new_deck_name):
                raise ValueError("can't have the same name")
            deck=Deck(id=result.id,created_at=result.created_at,user_id=user_id,deckname=new_deck_name,description=new_description)
            self.deck_repo.save(deck)
            return deck
        
        


    
