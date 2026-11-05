from uuid import UUID
from entity.repo.subdeckRepo import SubDeckRepository
from entity.subdeck import SubDeck


class UpdateDeck:
    def __init__(self, sub_deck_repo: SubDeckRepository):
        self.sub_deck_repo = sub_deck_repo

    def execute(self,
                deck_id: UUID,
                sub_deck_id: UUID,
                user_id: UUID,
                new_sub_deck_name: str,
                new_description: str | None,
                ):
        result = self.sub_deck_repo.get(
            user_id=user_id,
            deck_id=deck_id,
            subdeck_id=sub_deck_id)
        if not result:
            raise ValueError("does not exist")
        if result.user_id != user_id:
            raise ValueError("User Authentication Error")

        if self.sub_deck_repo.exists_by_name(
                user_id=user_id, deck_id=deck_id, subdeckname=new_sub_deck_name):
            raise ValueError("can't have the same name")
        deck = SubDeck(
            deck_id=result.deck_id,
            id=result.id,
            created_at=result.created_at,
            user_id=result.user_id,
            subdeckname=new_sub_deck_name)
        self.sub_deck_repo.save(deck)
        return deck
