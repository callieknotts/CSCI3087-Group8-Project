# presentation/schemas/user.py
from pydantic import BaseModel, Field


class SubDeckSchema(BaseModel):
    subdeckname: str = Field(min_length=1)
class SubDeckUpdateSchema(BaseModel):
    subdeckname: str | None = None
    # description: str | None = None

