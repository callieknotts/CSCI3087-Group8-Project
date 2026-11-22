from uuid import UUID
from entity.repo.deckRepo import DeckRepository


class ReadDeck:
    def __init__(self, deck_repo: DeckRepository):
        self.deck_repo = deck_repo

    def execute(self,
                user_id: UUID,
                sort:str,
                order:str
                ):
        result = self.deck_repo.get_all(user_id=user_id,sort=sort,order=order)
        # if not result:
        #     raise ValueError("No decks I guess")
        return result


class GetDeck:
    def __init__(self, deck_repo: DeckRepository):
            self.deck_repo = deck_repo
    
    def execute(self,
            user_id: UUID,
            deck_id: UUID
            ):
            result = self.deck_repo.get(deck_id=deck_id,user_id=user_id)
            if not result:
                 ValueError("Shi not found")
            # if not result:
            #     raise ValueError("No decks I guess")
            return result
