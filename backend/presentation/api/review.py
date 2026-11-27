from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database import get_db

from presentation.dependencies import (
    get_review_scheduler,
    get_card_review_state_repository,
    get_review_log_repository
)

from use_case.review.reviewSheduler import ReviewScheduler

from entity.repo.cardreviewstateRepo import (
    CardReviewStateRepository
)
from entity.repo.reviewlogRepo import (
    ReviewLogRepository
)

from presentation.api.user import get_current_user

from presentation.schemas.review import (
    SubmitReviewRequest,
    NextIntervalsResponse,
    ReviewStateResponse,
    ReviewStatesResponse,
    DueCardsResponse,
    ReviewLogResponse
)


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
)


def to_intervals_response(state) -> NextIntervalsResponse:
    """What each rating would do to this card (None = a new card)."""
    intervals = ReviewScheduler.preview_intervals(state)

    return NextIntervalsResponse(
        **{rating.value: days for rating, days in intervals.items()}
    )


def to_state_response(state) -> ReviewStateResponse:
    return ReviewStateResponse(
        id=state.id,
        user_id=state.user_id,
        card_id=state.card_id,
        repetitions=state.repetitions,
        ease_factor=state.ease_factor,
        interval_days=state.interval_days,
        due_at=state.due_at,
        last_reviewed_at=state.last_reviewed_at,
        lapses=state.lapses,
        learning_step=state.learning_step,
        next_intervals=to_intervals_response(state)
    )


# 1. Submit a review
@router.post("/{card_id}", response_model=ReviewStateResponse)
def review_card(
    card_id: UUID,
    request: SubmitReviewRequest,
    db: Session = Depends(get_db),
    scheduler: ReviewScheduler = Depends(get_review_scheduler),
    current_user=Depends(get_current_user)
):

    try:
        state = scheduler.review(
            user_id=current_user.id,
            card_id=card_id,
            rating=request.rating
        )

        db.commit()

        return to_state_response(state)

    except ValueError as error:
        db.rollback()
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception:
        db.rollback()
        raise


# 2. Get cards currently due for review
@router.get("/due", response_model=DueCardsResponse)
def get_due_cards(
    repository: CardReviewStateRepository = Depends(
        get_card_review_state_repository
    ),
    current_user=Depends(get_current_user)
):

    states = repository.get_due_cards(current_user.id)

    return DueCardsResponse(
        cards=[to_state_response(state) for state in states]
    )


# 2b. Get every review state of the current user (used by the frontend to tell
# cards that were never reviewed apart from cards that are not due yet)
@router.get("/states", response_model=ReviewStatesResponse)
def get_review_states(
    repository: CardReviewStateRepository = Depends(
        get_card_review_state_repository
    ),
    current_user=Depends(get_current_user)
):

    states = repository.get_all(current_user.id)

    return ReviewStatesResponse(
        states=[to_state_response(state) for state in states],
        new_card_intervals=to_intervals_response(None)
    )


# 3. Get review history for a specific card
@router.get(
    "/history/{card_id}",
    response_model=list[ReviewLogResponse]
)
def get_review_history(
    card_id: UUID,
    repository: ReviewLogRepository = Depends(
        get_review_log_repository
    ),
    current_user=Depends(get_current_user)
):

    history = repository.get_by_card(
        user_id=current_user.id,
        card_id=card_id
    )

    return history