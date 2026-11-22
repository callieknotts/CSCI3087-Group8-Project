
from pydantic import BaseModel, Field, field_validator
from uuid import UUID


class CardSchema(BaseModel):
    front_text: str | None = Field(default=None, min_length=1)
    back_text: str | None = Field(default=None, min_length=1)

    front_image: str | None = None
    back_image: str | None = None

    position: int
    subdeck_id: UUID | None = None

    @field_validator(
        "front_text",
        "back_text",
        "front_image",
        "back_image",
        mode="before"
    )
    @classmethod
    def empty_string_to_none(cls, value):
        if value == "":
            return None
        return value

class UpdateCardSchema(BaseModel):
    front_text: str | None = Field(default=None, min_length=1)
    back_text: str | None = Field(default=None, min_length=1)

    front_image: str | None = None
    back_image: str | None = None

    subdeck_id: UUID | None = None
    position: int | None = None

    @field_validator(
        "front_text",
        "back_text",
        "front_image",
        "back_image",
        mode="before"
    )
    @classmethod
    def empty_string_to_none(cls, value):
        if value == "":
            return None
        return value