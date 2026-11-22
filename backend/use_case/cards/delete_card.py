from uuid import UUID
from entity.repo.cardRepo import CardRepository
# from entity.deck import Deck


class DeleteCard:
    def __init__(self, card_repo: CardRepository):
        self.card_repo = card_repo

    def execute(self,
                user_id: UUID,
                deck_id: UUID,
                card_id: UUID
                ):
        deleted = self.card_repo.delete(deck_id=deck_id, user_id=user_id, card_id=card_id)

        if not deleted:
            raise ValueError("Deck not found")
        return deleted
