
from uuid import UUID

from entity.card import Card
from entity.cardcontent import CardContent, CardSide
from entity.repo.cardRepo import CardRepository
from entity.repo.deckRepo import DeckRepository
from entity.repo.subdeckRepo import SubDeckRepository


class UpdateCard:
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
        card_id: UUID,
        deck_id: UUID,
        user_id: UUID,
        front_text: str | None = None,
        back_text: str | None = None,
        front_image_key: str | None = None,
        back_image_key: str | None = None,
        subdeck_id: UUID | None = None,
        position: int | None = None,
        fields_set: set[str] = set()
    ) -> Card:

        # Verify deck ownership
        deck = self.deck_repo.get(
            user_id=user_id,
            deck_id=deck_id
        )

        if not deck:
            raise ValueError("Deck does not exist")

        # Retrieve existing card
        result = self.card_repo.get(
            deck_id=deck_id,
            card_id=card_id
        )

        if not result:
            raise ValueError("Card does not exist")

        # Preserve existing values when fields aren't provided
        front_text = (
            front_text if "front_text" in fields_set
            else result.content.front.text
        )

        back_text = (
            back_text if "back_text" in fields_set
            else result.content.back.text
        )

        front_image_key = (
            front_image_key if "front_image" in fields_set
            else result.content.front.image_key
        )

        back_image_key = (
            back_image_key if "back_image" in fields_set
            else result.content.back.image_key
        )

        subdeck_id = (
            subdeck_id if "subdeck_id" in fields_set
            else result.subdeck_id
        )

        position = (
            position if "position" in fields_set
            else result.position
        )

        # Validate subdeck relationship if one is provided
        if subdeck_id is not None:
            subdeck = self.subdeck_repo.get(
                user_id=user_id,
                deck_id=deck_id,
                subdeck_id=subdeck_id
            )

            if not subdeck:
                raise ValueError("Subdeck does not exist in this deck")

        # Reconstruct card content
        content = CardContent(
            front=CardSide(
                text=front_text,
                image_key=front_image_key
            ),
            back=CardSide(
                text=back_text,
                image_key=back_image_key
            )
        )

        # Construct updated entity
        card = Card(
            id=result.id,
            deck_id=result.deck_id,
            subdeck_id=subdeck_id,
            created_at=result.created_at,
            updated_at=result.updated_at,
            position=position,
            content=content
        )

        return self.card_repo.save(card)
