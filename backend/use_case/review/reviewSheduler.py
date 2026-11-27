
from datetime import datetime, timezone, timedelta
from uuid import UUID

from entity.CardReviewState import CardReviewState
from entity.ReviewLog import ReviewLog, Rating
from entity.repo.cardreviewstateRepo import CardReviewStateRepository
from entity.repo.reviewlogRepo import ReviewLogRepository


class ReviewScheduler:

    def __init__(
        self,
        state_repository: CardReviewStateRepository,
        log_repository: ReviewLogRepository
    ):
        self.state_repository = state_repository
        self.log_repository = log_repository

    def review(
        self,
        user_id: UUID,
        card_id: UUID,
        rating: Rating
    ) -> CardReviewState:

        now = datetime.now(timezone.utc)

        state = self.state_repository.get_by_user_card(
            user_id, card_id
        )

        if state is None:
            state = CardReviewState.create(user_id, card_id)
            is_new = True
        else:
            is_new = False

        previous_interval = state.interval_days
        next_interval = self._calculate_interval(state, rating)

        # Update scheduling state
        state.interval_days = next_interval
        state.due_at = now + timedelta(days=next_interval)
        state.last_reviewed_at = now

        if rating == Rating.AGAIN:
            state.repetitions = 0
            state.lapses += 1
            state.learning_step = 0

        else:
            state.repetitions += 1
            state.learning_step = 0

        if rating == Rating.HARD:
            state.ease_factor = max(1.3, state.ease_factor - 0.15)

        elif rating == Rating.EASY:
            state.ease_factor += 0.15

        # Create immutable review history
        log = ReviewLog.create(
            user_id=user_id,
            card_id=card_id,
            rating=rating,
            previous_interval=previous_interval,
            next_interval=next_interval,
            reviewed_at=now
        )

        # Persist state
        if is_new:
            self.state_repository.add(state)
        else:
            self.state_repository.update(state)

        # Persist review history
        self.log_repository.add(log)

        return state

    @staticmethod
    def preview_intervals(
        state: CardReviewState | None
    ) -> dict[Rating, float]:
        """Days until the card comes back for each rating button.

        state=None means a card that was never reviewed. Nothing is saved
        or changed; this uses the same calculation as review(), so the
        buttons always promise what a review really does.
        """

        if state is None:
            # a new card is scheduled like a fresh review state
            state = CardReviewState.create(user_id=None, card_id=None)

        return {
            rating: ReviewScheduler._calculate_interval(state, rating)
            for rating in Rating
        }

    @staticmethod
    def _calculate_interval(
        state: CardReviewState,
        rating: Rating
    ) -> float:

        repetitions = state.repetitions
        interval = state.interval_days
        ease = state.ease_factor

        if rating == Rating.AGAIN:
            # 10 minutes expressed in days
            return 10 / 1440

        if rating == Rating.HARD:
            if repetitions == 0:
                return 1.0

            return max(1.0, interval * 1.2)

        if rating == Rating.GOOD:
            if repetitions == 0:
                return 1.0
            elif repetitions == 1:
                return 3.0

            return interval * ease

        if rating == Rating.EASY:
            if repetitions == 0:
                return 4.0

            return max(4.0, interval * ease * 1.3)

        raise ValueError(f"Invalid rating: {rating}")
