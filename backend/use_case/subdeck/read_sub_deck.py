from uuid import UUID
from entity.repo.subdeckRepo import SubDeckRepository
# from entity.subdeck import SubDeck


class ReadSubDeck:
    def __init__(self, deck_repo: SubDeckRepository):
        self.deck_repo = deck_repo

    def execute(self,
                user_id: UUID,
                deck_id: UUID
                ):
        result = self.deck_repo.get_all(user_id=user_id, deck_id=deck_id)
        if not result:
            raise ValueError("No decks I guess")
        return result
class GetSubDeck:
    def __init__(self, deck_repo: SubDeckRepository):
        self.deck_repo = deck_repo

    def execute(self,
                user_id: UUID,
                deck_id: UUID,
                subdeck_id: UUID
                ):
        result = self.deck_repo.get(user_id=user_id, deck_id=deck_id,subdeck_id=subdeck_id)
        if not result:
            raise ValueError("Page not found")
        return result