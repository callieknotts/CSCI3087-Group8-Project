from uuid import UUID

from entity.repo.starredcardRepo import StarredCardRepository
from entity.starredcard import StarredCard


class ListStarredCards:
    """Every card the user has starred, oldest star first."""

    def __init__(self, star_repo: StarredCardRepository):
        self.star_repo = star_repo

    def execute(self, user_id: UUID) -> list[StarredCard]:
        return self.star_repo.get_all(user_id)
