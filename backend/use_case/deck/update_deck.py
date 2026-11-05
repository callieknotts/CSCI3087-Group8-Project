from uuid import UUID
from entity.repo.deckRepo import DeckRepository
from entity.deck import Deck


class UpdateDeck:
    def __init__(self, deck_repo: DeckRepository):
        self.deck_repo = deck_repo

    def execute(self,
                deck_id: UUID,
                user_id: UUID,
                new_deck_name: str | None = None,
                new_description: str | None = None,
                fields_set: set[str] = set(),

                ):
        result = self.deck_repo.get(user_id=user_id, deck_id=deck_id)
        if not result:
            raise ValueError("does not exist")
        # if result.user_id != user_id:
        #      raise ValueError("User Authentication Error")
        new_deck_name = (
            new_deck_name if "deckname" in fields_set else result.deckname)
        new_description = (
            new_description
            if "description" in fields_set
            else result.description
        )
        if new_deck_name != result.deckname and self.deck_repo.exists_by_name(
                user_id=result.user_id, deckname=new_deck_name):
            raise ValueError("can't have the same name")
        deck = Deck(
            id=result.id,
            created_at=result.created_at,
            user_id=user_id,
            deckname=new_deck_name,
            description=new_description)
        self.deck_repo.save(deck)
        return deck
