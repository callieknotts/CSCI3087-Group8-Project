from uuid import UUID

from entity.repo.starredcardRepo import StarredCardRepository
from entity.starredcard import StarredCard


class StarCard:
    """Stars a card for a user. Starring twice is fine: it stays starred."""

    def __init__(self, star_repo: StarredCardRepository):
        self.star_repo = star_repo

    def execute(self, user_id: UUID, card_id: UUID) -> StarredCard:
        # a card in somebody else's deck looks exactly like a missing card
        if not self.star_repo.card_owned_by_user(user_id, card_id):
            raise ValueError("Card not found")

        existing = self.star_repo.get_by_user_card(user_id, card_id)

        if existing is not None:
            return existing

        return self.star_repo.add(StarredCard.create(user_id, card_id))
