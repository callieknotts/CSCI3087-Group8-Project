from uuid import uuid4

import pytest

from entity.CardReviewState import CardReviewState
from entity.ReviewLog import Rating
from use_case.review.reviewSheduler import ReviewScheduler

MINUTES_10 = 10 / 1440


class FakeStateRepository:
    def __init__(self, states=None):
        self.states = {s.card_id: s for s in (states or [])}
        self.added = []
        self.updated = []

    def get_by_user_card(self, user_id, card_id):
        return self.states.get(card_id)

    def add(self, state):
        self.states[state.card_id] = state
        self.added.append(state)
        return state

    def update(self, state):
        self.states[state.card_id] = state
        self.updated.append(state)
        return state


class FakeLogRepository:
    def __init__(self):
        self.logs = []

    def add(self, log):
        self.logs.append(log)
        return log


def make_scheduler(states=None):
    states_repo = FakeStateRepository(states)
    log_repo = FakeLogRepository()
    return ReviewScheduler(states_repo, log_repo), states_repo, log_repo


def make_state(user_id, card_id, repetitions, interval_days, ease_factor=2.5):
    return CardReviewState.create(
        user_id=user_id,
        card_id=card_id,
        repetitions=repetitions,
        interval_days=interval_days,
        ease_factor=ease_factor,
    )


# ---------- preview_intervals: what the rating buttons show ----------

def test_preview_for_a_new_card():
    assert ReviewScheduler.preview_intervals(None) == {
        Rating.AGAIN: MINUTES_10,
        Rating.HARD: 1.0,
        Rating.GOOD: 1.0,
        Rating.EASY: 4.0,
    }


def test_preview_for_a_card_in_review():
    state = make_state(uuid4(), uuid4(), repetitions=2, interval_days=3)

    preview = ReviewScheduler.preview_intervals(state)

    assert preview[Rating.AGAIN] == MINUTES_10
    assert preview[Rating.HARD] == pytest.approx(3.6)
    assert preview[Rating.GOOD] == pytest.approx(7.5)
    assert preview[Rating.EASY] == pytest.approx(9.75)


def test_good_is_one_day_then_three_days_then_interval_times_ease():
    user_id, card_id = uuid4(), uuid4()
    good = [
        ReviewScheduler.preview_intervals(
            make_state(user_id, card_id, repetitions, interval)
        )[Rating.GOOD]
        for repetitions, interval in [(0, 0.0), (1, 1.0), (2, 3.0)]
    ]

    assert good == [1.0, 3.0, 7.5]


def test_preview_changes_nothing():
    state = make_state(uuid4(), uuid4(), repetitions=2, interval_days=3)
    before = (state.repetitions, state.interval_days, state.ease_factor)

    ReviewScheduler.preview_intervals(state)

    assert (state.repetitions, state.interval_days, state.ease_factor) == before


def test_preview_matches_what_a_review_really_does():
    user_id, card_id = uuid4(), uuid4()
    state = make_state(user_id, card_id, repetitions=2, interval_days=3)

    for rating in Rating:
        promised = ReviewScheduler.preview_intervals(state)[rating]
        scheduler, _, _ = make_scheduler(
            [make_state(user_id, card_id, repetitions=2, interval_days=3)]
        )

        assert scheduler.review(user_id, card_id, rating).interval_days == promised


# ---------- review: saving the result ----------

def test_first_review_creates_the_state_and_a_log():
    user_id, card_id = uuid4(), uuid4()
    scheduler, states, logs = make_scheduler()

    state = scheduler.review(user_id, card_id, Rating.GOOD)

    assert states.added == [state]
    assert state.repetitions == 1
    assert state.interval_days == 1.0
    assert len(logs.logs) == 1
    assert logs.logs[0].rating == Rating.GOOD
    assert logs.logs[0].previous_interval == 0.0
    assert logs.logs[0].next_interval == 1.0


def test_later_reviews_update_the_existing_state():
    user_id, card_id = uuid4(), uuid4()
    scheduler, states, _ = make_scheduler()

    scheduler.review(user_id, card_id, Rating.GOOD)
    state = scheduler.review(user_id, card_id, Rating.GOOD)

    assert len(states.added) == 1
    assert states.updated == [state]
    assert state.repetitions == 2
    assert state.interval_days == 3.0


def test_again_counts_a_lapse_and_starts_over():
    user_id, card_id = uuid4(), uuid4()
    scheduler, _, _ = make_scheduler(
        [make_state(user_id, card_id, repetitions=4, interval_days=20)]
    )

    state = scheduler.review(user_id, card_id, Rating.AGAIN)

    assert state.repetitions == 0
    assert state.lapses == 1
    assert state.interval_days == MINUTES_10


def test_hard_lowers_the_ease_but_never_below_the_minimum():
    user_id, card_id = uuid4(), uuid4()
    scheduler, _, _ = make_scheduler(
        [make_state(user_id, card_id, 2, 3, ease_factor=1.35)]
    )

    state = scheduler.review(user_id, card_id, Rating.HARD)

    assert state.ease_factor == pytest.approx(1.3)


def test_easy_raises_the_ease():
    user_id, card_id = uuid4(), uuid4()
    scheduler, _, _ = make_scheduler()

    state = scheduler.review(user_id, card_id, Rating.EASY)

    assert state.ease_factor == pytest.approx(2.65)
    assert state.interval_days == 4.0
