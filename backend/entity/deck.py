from dataclasses import dataclass
from uuid import UUID, uuid4
from datetime import datetime
# from enum import Enum

# class Visibility(Enum, str):
#     PUBLIC= "public"
#     PRIVATE= "private"


@dataclass
class Deck:
    id: UUID
    user_id: UUID
    deckname:str
    description: str | None
    created_at: datetime
    # last_opened_at: datetime
    # visibility: Visibility




    @classmethod
    def create(cls,
               user_id: UUID,
               deckname: str,
               description: str | None)->"Deck":
        return(cls(
            id= uuid4(),
            user_id=user_id,
            deckname=deckname,
            description=description,
            created_at=datetime.now()
            ))