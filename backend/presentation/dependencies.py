
from fastapi import Depends
from sqlalchemy.orm import Session

from infrastructure.database import get_db

from infrastructure.postgres_repositories.userRepo import (
    PostgresUserRepository
)
from infrastructure.postgres_repositories.deckRepo import (
    PostgresDeckRepository
)
from infrastructure.postgres_repositories.subdeckRepo import (
    PostgresSubDeckRepository
)
from infrastructure.postgres_repositories.cardRepo import (
    PostgresCardRepository
)
from infrastructure.postgres_repositories.cardReviewStateRepo import (
    PostgresCardReviewStateRepository
)
from infrastructure.postgres_repositories.reviewLogRepo import (
    PostgresReviewLogRepository
)
from infrastructure.postgres_repositories.starredCardRepo import (
    PostgresStarredCardRepository
)

from use_case.review.reviewSheduler import ReviewScheduler


def get_user_repository(db: Session = Depends(get_db)):
    return PostgresUserRepository(db)


def get_deck_repository(db: Session = Depends(get_db)):
    return PostgresDeckRepository(db)


def get_sub_deck_repository(db: Session = Depends(get_db)):
    return PostgresSubDeckRepository(db)


def get_card_repository(db: Session = Depends(get_db)):
    return PostgresCardRepository(db)


def get_card_review_state_repository(
    db: Session = Depends(get_db)
):
    return PostgresCardReviewStateRepository(db)


def get_review_log_repository(
    db: Session = Depends(get_db)
):
    return PostgresReviewLogRepository(db)


def get_starred_card_repository(
    db: Session = Depends(get_db)
):
    return PostgresStarredCardRepository(db)


def get_review_scheduler(
    db: Session = Depends(get_db)
):
    state_repository = PostgresCardReviewStateRepository(db)
    log_repository = PostgresReviewLogRepository(db)

    return ReviewScheduler(
        state_repository=state_repository,
        log_repository=log_repository
    )
