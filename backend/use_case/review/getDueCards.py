
from datetime import datetime, timezone
from uuid import UUID

from entity.repo.cardreviewstateRepo import CardReviewStateRepository


class GetDueCards:

    def __init__(self, review_state_repo: CardReviewStateRepository):
        self.review_state_repo = review_state_repo

    def execute(self, user_id: UUID):

        now = datetime.now(timezone.utc)

        return self.review_state_repo.get_due_cards(
            user_id=user_id,
            current_time=now
        )
