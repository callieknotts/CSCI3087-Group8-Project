from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from entity.repo.starredcardRepo import StarredCardRepository
from infrastructure.database import get_db
from presentation.auth import get_current_user
from presentation.dependencies import get_starred_card_repository
from presentation.schemas.star import StarredCardsResponse, StarResponse
from use_case.star.list_starred_cards import ListStarredCards
from use_case.star.star_card import StarCard
from use_case.star.unstar_card import UnstarCard


router = APIRouter(prefix="/stars", tags=["stars"])


# 1. Every card the current user has starred (just the ids: the frontend
# already has the cards from the deck endpoints)
@router.get("/", response_model=StarredCardsResponse)
def get_starred_cards(
    repo: StarredCardRepository = Depends(get_starred_card_repository),
    current_user=Depends(get_current_user)
):
    stars = ListStarredCards(repo).execute(user_id=current_user.id)

    return StarredCardsResponse(card_ids=[star.card_id for star in stars])


# 2. Star a card (safe to repeat)
@router.put("/{card_id}", response_model=StarResponse)
def star_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    repo: StarredCardRepository = Depends(get_starred_card_repository),
    current_user=Depends(get_current_user)
):
    try:
        StarCard(repo).execute(user_id=current_user.id, card_id=card_id)
        db.commit()

    except ValueError as error:
        db.rollback()
        raise HTTPException(status_code=404, detail=str(error))

    except IntegrityError:
        # two requests starred the same card at the same moment: the other
        # one won, and the card is starred, which is what was asked for
        db.rollback()

    except Exception:
        db.rollback()
        raise

    return StarResponse(card_id=card_id, starred=True)


# 3. Remove the star from a card (safe to repeat)
@router.delete("/{card_id}", response_model=StarResponse)
def unstar_card(
    card_id: UUID,
    db: Session = Depends(get_db),
    repo: StarredCardRepository = Depends(get_starred_card_repository),
    current_user=Depends(get_current_user)
):
    try:
        UnstarCard(repo).execute(user_id=current_user.id, card_id=card_id)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return StarResponse(card_id=card_id, starred=False)
