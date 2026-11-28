from uuid import UUID

from entity.repo.starredcardRepo import StarredCardRepository


class UnstarCard:
    """Removes a user's star from a card. Un-starring a card that is not
    starred (or no longer exists) is fine: the result is the same."""

    def __init__(self, star_repo: StarredCardRepository):
        self.star_repo = star_repo

    def execute(self, user_id: UUID, card_id: UUID) -> bool:
        # scoped to the user, so nobody can remove another user's star
        return self.star_repo.delete_by_user_card(user_id, card_id)
