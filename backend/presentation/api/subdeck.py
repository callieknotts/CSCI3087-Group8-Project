from fastapi import APIRouter, Depends, Request, HTTPException
from presentation.schemas.subdeck import SubDeckSchema, SubDeckUpdateSchema
from use_case.subdeck.create_sub_deck import CreateSubDeck
from use_case.subdeck.read_sub_deck import ReadSubDeck
from use_case.subdeck.delete_sub_deck import DeleteSubDeck
# from use_case.subdeck.update_subdeck import UpdatesubDeck
# # from use_case.login import LoginUser
# from uuid import UUID
from presentation.dependencies import get_sub_deck_repository
from presentation.auth import get_current_user
from uuid import UUID


router = APIRouter(prefix="/decks/{deck_id}/subdecks", tags=["subdecks"])
@router.post("/")
def addSubDeck(
    deck_id: UUID,
    data:SubDeckSchema,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
    ):

    return CreateSubDeck(repo).execute(deck_id=deck_id,user_id=current_user.id,subdeckname=data.subdeckname)
@router.get("/")
def getSubDecks(
    deck_id: UUID,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
    ):

    return ReadSubDeck(repo).execute(user_id=current_user.id,deck_id=deck_id)

@router.delete("/{subdeck_id}")
def deleteSubDeck(
    deck_id: UUID,
    subdeck_id: UUID,
    repo=Depends(get_sub_deck_repository),
    current_user=Depends(get_current_user)
):
    return DeleteSubDeck(repo).execute(deck_id=deck_id,user_id=current_user.id,subdeck_id=subdeck_id)

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
# @router.patch("/subdecks/{subdeck_id}")







