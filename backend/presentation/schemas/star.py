from uuid import UUID

from pydantic import BaseModel


class StarredCardsResponse(BaseModel):
    """The ids of every card the current user has starred."""
    card_ids: list[UUID]


class StarResponse(BaseModel):
    card_id: UUID
    starred: bool
