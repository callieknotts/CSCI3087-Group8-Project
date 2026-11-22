from fastapi import APIRouter, Depends, HTTPException
from presentation.schemas.card import CardSchema, UpdateCardSchema
from use_case.cards.delete_card import DeleteCard
from use_case.cards.update_card import UpdateCard
from use_case.cards.create_card import CreateCard
from use_case.cards.read_card import ReadDeckCards

# from use_case.login import LoginUser
# from uuid import UUID
from presentation.dependencies import get_deck_repository, get_card_repository, get_sub_deck_repository
from presentation.auth import get_current_user
from uuid import UUID


router = APIRouter(prefix="/decks/{deck_id}/cards", tags=["cards"])


@router.post("/")
def add_card(
    deck_id: UUID,
    data: CardSchema,
    deck_repo=Depends(get_deck_repository),
    subdeck_repo=Depends(get_sub_deck_repository),
    card_repo=Depends(get_card_repository),
    current_user=Depends(get_current_user)
):
    return CreateCard(
        deck_repo=deck_repo,
        subdeck_repo=subdeck_repo,
        card_repo=card_repo
    ).execute(
        user_id=current_user.id,
        deck_id=deck_id,
        front_text=data.front_text,
        back_text=data.back_text,
        front_image_key=data.front_image,
        back_image_key=data.back_image,
        position=data.position,
        subdeck_id=data.subdeck_id
    )

@router.get("/")
def get_all_by_decks(
    deck_id: UUID,
    subdeck_id:UUID|None=None,
    deck_repo=Depends(get_deck_repository),
    subdeck_repo=Depends(get_sub_deck_repository),
    card_repo=Depends(get_card_repository),
    current_user=Depends(get_current_user)
):
    return ReadDeckCards(deck_repo=deck_repo,subdeck_repo=subdeck_repo,card_repo=card_repo).execute(
        user_id=current_user.id,
        deck_id=deck_id,
        subdeck_id=subdeck_id
    )
@router.patch("/{card_id}")
def update_card(
    deck_id: UUID,
    card_id: UUID,
    data: UpdateCardSchema,
    deck_repo=Depends(get_deck_repository),
    subdeck_repo=Depends(get_sub_deck_repository),
    card_repo=Depends(get_card_repository),
    current_user=Depends(get_current_user)
):
    updates = data.model_dump(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one field to update"
        )

    try:
        return UpdateCard(
            card_repo=card_repo,
            deck_repo=deck_repo,
            subdeck_repo=subdeck_repo
        ).execute(
            user_id=current_user.id,
            deck_id=deck_id,
            card_id=card_id,
            front_text=data.front_text,
            back_text=data.back_text,
            front_image_key=data.front_image,
            back_image_key=data.back_image,
            subdeck_id=data.subdeck_id,
            position=data.position,
            fields_set=data.model_fields_set
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


# DELETE CARD
@router.delete("/{card_id}")
def delete_card(
    deck_id: UUID,
    card_id: UUID,
    deck_repo=Depends(get_deck_repository),
    card_repo=Depends(get_card_repository),
    current_user=Depends(get_current_user)
):
    try:
        return DeleteCard(
            deck_repo=deck_repo,
            card_repo=card_repo
        ).execute(
            user_id=current_user.id,
            deck_id=deck_id,
            card_id=card_id
        )

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

# @router.delete("/{deck_id}")
# def deleteDeck(
#     deck_id: UUID,
#     repo=Depends(get_deck_repository),
#     current_user=Depends(get_current_user)
# ):
#     return DeleteDeck(repo).execute(deck_id=deck_id, user_id=current_user.id)


# @router.patch("/{deck_id}")
# def updateDeck(
#     deck_id: UUID,
#     data: DeckUpdateSchema,
#     repo=Depends(get_deck_repository),
#     current_user=Depends(get_current_user)
# ):
#     updates = data.model_dump(exclude_unset=True)
#     if not updates:
#         raise HTTPException(
#             status_code=400,
#             detail="Provide at least one field to update",
#         )

#     # if not result:
#     #     raise HTTPException(status_code=404, detail="Deck not found")

#     # return result
#     try:
#         result = UpdateDeck(repo).execute(
#             new_deck_name=data.deckname,
#             new_description=data.description,
#             deck_id=deck_id,
#             user_id=current_user.id,
#             new_visibility=data.visibility,
#             fields_set=data.model_fields_set)

#         return result

#     except ValueError as e:
#         raise HTTPException(
#             status_code=404,
#             detail=str(e)
#         )
# # @router.patch("/decks/{deck_id}")

# @router.get("/{deck_id}")
# def getDeck(
#     deck_id: UUID,  
#     repo=Depends(get_deck_repository),
#     current_user=Depends(get_current_user)
#     ):
#     try:
#         result = GetDeck(repo).execute(
#                 deck_id=deck_id,
#                 user_id=current_user.id
#         )

#         return result
    
#     except ValueError as e:
#         raise HTTPException(
#             status_code=404,
#             detail=str(e)
#         )


