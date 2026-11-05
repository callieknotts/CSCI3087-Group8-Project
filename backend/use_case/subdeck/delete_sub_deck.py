from uuid import UUID
# from entity.subdeck import SubDeck
from entity.repo.subdeckRepo import SubDeckRepository


class DeleteSubDeck:
    def __init__(self, sub_deck_repo: SubDeckRepository):
        self.sub_deck_repo = sub_deck_repo

    def execute(self,
                user_id: UUID,
                deck_id: UUID,
                subdeck_id: UUID
                ):
        deleted = self.sub_deck_repo.delete(
            user_id=user_id, deck_id=deck_id, subdeck_id=subdeck_id)
        if not deleted:
            raise ValueError("Deck not found")
        return deleted
