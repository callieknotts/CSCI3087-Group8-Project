
from abc import ABC, abstractmethod
from uuid import UUID
from datetime import datetime

from entity.CardReviewState import CardReviewState


class CardReviewStateRepository(ABC):

    @abstractmethod
    def get(self, state_id: UUID) -> CardReviewState | None:
        pass

    @abstractmethod
    def get_by_user_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> CardReviewState | None:
        pass

    @abstractmethod
    def get_due_cards(
        self,
        user_id: UUID,
        current_time: datetime
    ) -> list[CardReviewState]:
        pass

    @abstractmethod
    def get_all(self, user_id: UUID) -> list[CardReviewState]:
        pass

    @abstractmethod
    def create(
        self,
        review_state: CardReviewState
    ) -> CardReviewState:
        pass

    @abstractmethod
    def update(
        self,
        review_state: CardReviewState
    ) -> CardReviewState:
        pass

    @abstractmethod
    def delete(self, state_id: UUID) -> bool:
        pass

from abc import ABC, abstractmethod
from uuid import UUID

from entity.CardReviewState import CardReviewState


class CardReviewStateRepository(ABC):

    @abstractmethod
    def get(self, state_id: UUID) -> CardReviewState | None:
        pass

    @abstractmethod
    def get_by_user_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> CardReviewState | None:
        pass

    @abstractmethod
    def get_due_cards(
        self,
        user_id: UUID
    ) -> list[CardReviewState]:
        pass

    @abstractmethod
    def get_all(self, user_id: UUID) -> list[CardReviewState]:
        pass

    @abstractmethod
    def add(self, state: CardReviewState) -> CardReviewState:
        pass

    @abstractmethod
    def update(self, state: CardReviewState) -> CardReviewState:
        pass

    @abstractmethod
    def delete(self, state_id: UUID) -> None:
        pass
