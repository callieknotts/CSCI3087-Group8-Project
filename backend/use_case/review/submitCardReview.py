
from datetime import datetime, timezone
from uuid import UUID

from entity.repo.cardreviewstateRepo import CardReviewStateRepository
from entity.repo.reviewlogRepo import ReviewLogRepository

from entity.CardReviewState import CardReviewState
from entity.ReviewLog import ReviewLog, Rating

from use_case.review.reviewSheduler import ReviewScheduler


class SubmitCardReview:

    def __init__(
        self,
        review_state_repo: CardReviewStateRepository,
        review_log_repo: ReviewLogRepository
    ):
        self.review_state_repo = review_state_repo
        self.review_log_repo = review_log_repo
        self.scheduler = ReviewScheduler()

    def execute(
        self,
        user_id: UUID,
        card_id: UUID,
        rating: Rating
    ):

        now = datetime.now(timezone.utc)

        state = self.review_state_repo.get_by_user_card(
            user_id=user_id,
            card_id=card_id
        )

        is_new = state is None

        if is_new:
            state = CardReviewState.create(
                user_id=user_id,
                card_id=card_id
            )

        previous_interval = state.interval_days

        schedule = self.scheduler.calculate(
            state=state,
            rating=rating,
            now=now
        )

        state.repetitions = schedule.repetitions
        state.ease_factor = schedule.ease_factor
        state.interval_days = schedule.interval_days
        state.lapses = schedule.lapses
        state.learning_step = schedule.learning_step
        state.due_at = schedule.due_at
        state.last_reviewed_at = now
        state.updated_at = now

        if is_new:
            self.review_state_repo.add(state)
        else:
            self.review_state_repo.update(state)

        review_log = ReviewLog.create(
            user_id=user_id,
            card_id=card_id,
            rating=rating,
            reviewed_at=now,
            previous_interval=previous_interval,
            next_interval=schedule.interval_days
        )

        self.review_log_repo.add(review_log)

        return state
