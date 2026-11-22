from uuid import UUID

from entity.repo.cardRepo import CardRepository
from entity.repo.deckRepo import DeckRepository
from entity.repo.subdeckRepo import SubDeckRepository


class ReadDeckCards:
    def __init__(
        self,
        card_repo: CardRepository,
        deck_repo: DeckRepository,
        subdeck_repo: SubDeckRepository
    ):
        self.card_repo = card_repo
        self.deck_repo = deck_repo
        self.subdeck_repo = subdeck_repo

    def execute(
        self,
        user_id: UUID,
        deck_id: UUID,
        subdeck_id: UUID | None = None
    ):
        deck = self.deck_repo.get(
            user_id=user_id,
            deck_id=deck_id
        )

        if deck is None:
            raise ValueError("Deck not found")

        if subdeck_id is not None:
            subdeck = self.subdeck_repo.get(
                user_id=user_id,
                deck_id=deck_id,
                subdeck_id=subdeck_id
            )

            if subdeck is None:
                raise ValueError("Subdeck not found")

            return self.card_repo.get_all_by_subdeck(
                deck_id=deck_id,
                subdeck_id=subdeck_id
            )

        return self.card_repo.get_all_by_deck(
            deck_id=deck_id
        )
