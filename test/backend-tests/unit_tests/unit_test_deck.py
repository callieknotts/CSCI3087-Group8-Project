import uuid
from datetime import datetime

from entity.deck import Deck


def test_create_deck_assigns_an_id_and_timestamp():
    user_id = uuid.uuid4()

    deck = Deck.create(
        user_id=user_id,
        deckname="Biology",
        description="Cell biology notes",
    )

    assert isinstance(deck.id, uuid.UUID)
    assert deck.user_id == user_id
    assert deck.deckname == "Biology"
    assert deck.description == "Cell biology notes"
    assert isinstance(deck.created_at, datetime)


def test_create_deck_allows_no_description():
    deck = Deck.create(
        user_id=uuid.uuid4(),
        deckname="Economics",
        description=None,
    )

    assert deck.description is None


def test_each_created_deck_gets_a_different_id():
    user_id = uuid.uuid4()

    first = Deck.create(user_id, "Biology", None)
    second = Deck.create(user_id, "Chemistry", None)

    assert first.id != second.id
