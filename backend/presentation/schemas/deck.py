# presentation/schemas/user.py
from pydantic import BaseModel, Field
from entity.deck import Visibility


class DeckSchema(BaseModel):
    deckname: str = Field(min_length=1)
    description: str | None = None
    visibility: Visibility = Visibility.PRIVATE

class DeckUpdateSchema(BaseModel):
    deckname: str | None = None
    description: str | None = None
    visibility: Visibility = Visibility.PRIVATE