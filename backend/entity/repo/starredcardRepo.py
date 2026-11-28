from abc import ABC, abstractmethod
from uuid import UUID

from entity.starredcard import StarredCard


class StarredCardRepository(ABC):

    @abstractmethod
    def card_owned_by_user(self, user_id: UUID, card_id: UUID) -> bool:
        """True if the card sits in one of this user's decks."""
        pass

    @abstractmethod
    def get_by_user_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> StarredCard | None:
        pass

    @abstractmethod
    def get_all(self, user_id: UUID) -> list[StarredCard]:
        pass

    @abstractmethod
    def add(self, star: StarredCard) -> StarredCard:
        pass

    @abstractmethod
    def delete_by_user_card(self, user_id: UUID, card_id: UUID) -> bool:
        """Remove the star. True if there was one to remove."""
        pass
