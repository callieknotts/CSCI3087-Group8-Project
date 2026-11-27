
from abc import ABC, abstractmethod
from uuid import UUID

from entity.ReviewLog import ReviewLog


class ReviewLogRepository(ABC):

    @abstractmethod
    def get(self, log_id: UUID) -> ReviewLog | None:
        pass

    @abstractmethod
    def get_by_card(
        self,
        user_id: UUID,
        card_id: UUID
    ) -> list[ReviewLog]:
        pass

    @abstractmethod
    def get_all(self, user_id: UUID) -> list[ReviewLog]:
        pass

    @abstractmethod
    def add(self, log: ReviewLog) -> ReviewLog:
        pass
