from uuid import UUID
from backend.entity.repo.deckRepo import DeckRepository
from backend.entity.deck import Deck
class CreateDeck:
    def __init__(self, deck_repo: DeckRepository):
        self.deck_repo=deck_repo
    def execute(self,
                user_id:UUID,
                description: str|None,
                deckname: str
                ):
            if deckname==None:
                raise ValueError("needs a deckname")
            if self.deck_repo.exists_by_name(user_id=user_id,deckname=deckname):
                raise ValueError("can't have the same name")
            deck=Deck.create(user_id=user_id,deckname=deckname,description=description)
            self.deck_repo.add(deck)
            return deck
        
        


    
