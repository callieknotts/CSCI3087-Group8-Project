# presentation/schemas/user.py
from pydantic import BaseModel, Field


class DeckSchema(BaseModel):
    deckname: str = Field(min_length=1)
    description: str| None=None
class DeckUpdateSchema(BaseModel):
    deckname: str | None = None
    description: str | None = None

