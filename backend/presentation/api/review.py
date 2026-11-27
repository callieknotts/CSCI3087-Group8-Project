
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
    ReviewStateResponse,
    DueCardsResponse,
    ReviewLogResponse
)


router = APIRouter(
    prefix="/reviews",
    tags=["Reviews"]
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

        return state

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

    cards = repository.get_due_cards(current_user.id)

    return DueCardsResponse(cards=cards)


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
