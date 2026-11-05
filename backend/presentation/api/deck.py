from fastapi import APIRouter, Depends, HTTPException
from presentation.schemas.deck import DeckSchema, DeckUpdateSchema
from use_case.deck.create_deck import CreateDeck
from use_case.deck.read_deck import ReadDeck
from use_case.deck.delete_deck import DeleteDeck
from use_case.deck.update_deck import UpdateDeck
# from use_case.login import LoginUser
# from uuid import UUID
from presentation.dependencies import get_deck_repository
from presentation.auth import get_current_user
from uuid import UUID


router = APIRouter(prefix="/decks", tags=["decks"])


@router.post("/")
def addDeck(
    data: DeckSchema,
    repo=Depends(get_deck_repository),
    current_user=Depends(get_current_user)
):

    return CreateDeck(repo).execute(user_id=current_user.id,
                                    deckname=data.deckname, description=data.description)


@router.get("/")
def getDecks(
    repo=Depends(get_deck_repository),
    current_user=Depends(get_current_user)
):

    return ReadDeck(repo).execute(user_id=current_user.id)


@router.delete("/{deck_id}")
def deleteDeck(
    deck_id: UUID,
    repo=Depends(get_deck_repository),
    current_user=Depends(get_current_user)
):
    return DeleteDeck(repo).execute(deck_id=deck_id, user_id=current_user.id)


@router.patch("/{deck_id}")
def updateDeck(
    deck_id: UUID,
    data: DeckUpdateSchema,
    repo=Depends(get_deck_repository),
    current_user=Depends(get_current_user)
):
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update",
        )

    # if not result:
    #     raise HTTPException(status_code=404, detail="Deck not found")

    # return result
    try:
        result = UpdateDeck(repo).execute(
            new_deck_name=data.deckname,
            new_description=data.description,
            deck_id=deck_id,
            user_id=current_user.id,
            fields_set=data.model_fields_set)

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )
# @router.patch("/decks/{deck_id}")
