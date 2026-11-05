from dataclasses import dataclass
from uuid import UUID, uuid4
from datetime import datetime


@dataclass
class SubDeck:
    id: UUID
    user_id: UUID
    deck_id: UUID
    subdeckname: str
    created_at: datetime

    @classmethod
    def create(cls,
               user_id: UUID,
               deck_id: UUID,
               subdeckname: str,
               ) -> "SubDeck":
        return (cls(
            id=uuid4(),
            user_id=user_id,
            deck_id=deck_id,
            subdeckname=subdeckname,
            created_at=datetime.now()
        ))
