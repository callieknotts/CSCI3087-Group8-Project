from entity.card import Card
from entity.cardcontent import CardContent, CardSide
from entity.repo.cardRepo import CardRepository
from entity.repo.deckRepo import DeckRepository
from entity.repo.subdeckRepo import SubDeckRepository
from uuid import UUID
class CreateCard:
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
            position:int,
            front_text: str|None,
            front_image_key: str|None,
            back_text: str|None,
            back_image_key: str|None,
            subdeck_id: UUID|None=None
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
        
        content = CardContent(
                    front=CardSide(
                        text=front_text,
                        image_key=front_image_key,
                    ),
                    back=CardSide(
                     text=back_text,
                        image_key=back_image_key,
                    )
                )
        
        card=Card.create(deck_id=deck_id,subdeck_id=subdeck_id,position=position,content=content)
        self.card_repo.add(card)
        return card
        
        