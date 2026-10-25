from uuid import UUID
from backend.entity.repo.deckRepo import DeckRepository
from backend.entity.deck import Deck
class ReadDeck:
    def __init__(self, deck_repo: DeckRepository):
        self.deck_repo=deck_repo
    def execute(self,
                user_id:UUID
                ):
            result= self.deck_repo.get_all(user_id=user_id)
            if not result:
                raise ValueError("No decks I guess")
            return result
        
        


    
