from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database import get_db
from infrastructure.models.usermodel import UserModel
from presentation.auth import get_current_user
from presentation.dependencies import get_deck_repository
from use_case.deck.read_deck import ReadDeck
from presentation.schemas.user import UpdateUserSchema
router = APIRouter(prefix="/profile", tags=["profile"])




@router.get("/")
def get_profile(
    current_user=Depends(get_current_user),
    deck_repo=Depends(get_deck_repository),
):
    decks = ReadDeck(deck_repo).execute(user_id=current_user.id)
    created_at = getattr(current_user, "created_at", None)

    return {
        "name": current_user.name,
        "username": current_user.username,
        "email": current_user.email,
        "member_since": created_at.isoformat() if created_at else None,
        "stats": {
            "total_decks": len(decks) if decks is not None else 0,
        },
    }


@router.put("/")
def update_profile(
    data: UpdateUserSchema,
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    name = data.name.strip()
    username = data.username.strip()
    email = data.email.strip().lower()

    if not name or not username:
        raise HTTPException(status_code=400, detail="Name and username can't be empty")

    taken_username = (
        db.query(UserModel)
        .filter(UserModel.username == username, UserModel.id != current_user.id)
        .first()
    )
    if taken_username:
        raise HTTPException(status_code=409, detail="Username already taken")

    taken_email = (
        db.query(UserModel)
        .filter(UserModel.email == email, UserModel.id != current_user.id)
        .first()
    )
    if taken_email:
        raise HTTPException(status_code=409, detail="Email already in use")

    user = db.get(UserModel, current_user.id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    user.name = name
    user.username = username
    user.email = email
    db.commit() 

    return {"name": user.name, "username": user.username, "email": user.email}