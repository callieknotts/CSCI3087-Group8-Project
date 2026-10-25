from uuid import UUID
from backend.entity.repo.deckRepo import DeckRepository
from backend.entity.deck import Deck
class DeleteDeck:
    def __init__(self, deck_repo: DeckRepository):
        self.deck_repo=deck_repo
    def execute(self,
                user_id:UUID,
                deck_id: UUID
                ):
            deleted = self.deck_repo.delete(deck_id, user_id)

            if not deleted:
                raise ValueError("Deck not found")
            return deleted
        
        


    
