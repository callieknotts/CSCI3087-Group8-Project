from uuid import UUID

from fastapi import Depends, HTTPException, Request
from backend.infrastructure.postgres_repositories.userRepo import (
    PostgresUserRepository,
)
from backend.presentation.dependencies import get_user_repository


def get_current_user(
    request: Request,
    repo: PostgresUserRepository = Depends(get_user_repository),
):
    user_id = request.session.get("user_id")

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Not authenticated",
        )

    try:
        user_id = UUID(user_id)
    except (ValueError, TypeError):
        request.session.clear()
        raise HTTPException(
            status_code=401,
            detail="Invalid session",
        )

    user = repo.get(user_id=user_id)

    if user is None:
        request.session.clear()
        raise HTTPException(
            status_code=401,
            detail="User no longer exists",
        )

    return user