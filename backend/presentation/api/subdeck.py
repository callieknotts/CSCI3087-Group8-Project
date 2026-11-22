from fastapi import APIRouter, Depends, HTTPException
from presentation.schemas.subdeck import SubDeckSchema, SubDeckUpdateSchema
from use_case.subdeck.create_sub_deck import CreateSubDeck
from use_case.subdeck.read_sub_deck import ReadSubDeck, GetSubDeck
from use_case.subdeck.delete_sub_deck import DeleteSubDeck
from use_case.subdeck.update_sub_deck import UpdateSubDeck
# # from use_case.login import LoginUser
# from uuid import UUID
from presentation.dependencies import get_sub_deck_repository
from presentation.auth import get_current_user
from uuid import UUID


router = APIRouter(prefix="/decks/{deck_id}/subdecks", tags=["subdecks"])


@router.post("/")
def addSubDeck(
    deck_id: UUID,
    data: SubDeckSchema,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
):

    return CreateSubDeck(repo).execute(
        deck_id=deck_id, user_id=current_user.id, subdeckname=data.subdeckname)


@router.get("/")
def getAllSubDecks(
    deck_id: UUID,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
):

    return ReadSubDeck(repo).execute(user_id=current_user.id, deck_id=deck_id)

@router.get("/{subdeck_id}")
def getSubDeck(
    deck_id: UUID,
    subdeck_id: UUID,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
    ):
    return GetSubDeck(repo).execute(user_id=current_user.id,subdeck_id=subdeck_id,deck_id=deck_id)
@router.delete("/{subdeck_id}")
def deleteSubDeck(
    deck_id: UUID,
    subdeck_id: UUID,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
):
    return DeleteSubDeck(repo).execute(
        deck_id=deck_id, user_id=current_user.id, subdeck_id=subdeck_id)

@router.patch("/{subdeck_id}")
def updateDeck(
    deck_id: UUID,
    subdeck_id: UUID,
    data: SubDeckUpdateSchema,
    repo=Depends(get_sub_deck_repository),
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
        result = UpdateSubDeck(repo).execute(
            new_sub_deck_name=data.subdeckname,
            deck_id=deck_id,
            sub_deck_id=subdeck_id,
            user_id=current_user.id,
            fields_set=data.model_fields_set)

        return result

    except ValueError as e:
        raise HTTPException(
            status_code=404,
            detail=str(e)
        )

# @router.patch("/{subdeck_id}")
# def updateSubDeck(
#     deck_id: UUID,
#     subdeck_id: UUID,
#     data: subDeckUpdateSchema,
#     repo=Depends(get_sub_deck_repository),
#     current_user=Depends(get_current_user)
# ):
#     updates = data.model_dump(exclude_unset=True)
#     if not updates:
#         raise HTTPException(
#             status_code=400,
#             detail="Provide at least one field to update",
#         )
#     result= UpdatesubDeck(repo).execute(new_subdeck_name=data.subdeckname,new_description=data.description,subdeck_id=subdeck_id,user_id=current_user.id)
#     if not result:
#         raise HTTPException(status_code=404, detail="subDeck not found")

#     return result
