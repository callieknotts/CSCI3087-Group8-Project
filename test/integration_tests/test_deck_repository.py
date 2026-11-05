
import uuid
from datetime import datetime, timezone

from entity.deck import Deck
from infrastructure.models.usermodel import UserModel

# Adjust this import to your actual repository filename.
from infrastructure.postgres_repositories.deckRepo import (
    PostgresDeckRepository
)


def create_test_user(db_session):
    user = UserModel(
        id=uuid.uuid4(),
        name="Dylan",
        email=f"{uuid.uuid4()}@example.com",
        username=str(uuid.uuid4())[:8],
        password="hashed_password1!H",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )

    db_session.add(user)
    db_session.flush()

    return user


def create_test_deck(user_id, deckname="Computer Science"):
    return Deck(
        id=uuid.uuid4(),
        user_id=user_id,
        deckname=deckname,
        description="Test description",
        created_at=datetime.now(timezone.utc)
    )


def test_add_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)
    deck = create_test_deck(user.id)

    result = repository.add(deck)

    assert result.id == deck.id

    saved_deck = repository.get(user.id, deck.id)

    assert saved_deck is not None
    assert saved_deck.deckname == "Computer Science"


def test_get_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)
    deck = create_test_deck(user.id)

    repository.add(deck)

    result = repository.get(user.id, deck.id)

    assert result is not None
    assert result.id == deck.id
    assert result.user_id == user.id
    assert result.deckname == deck.deckname


def test_get_nonexistent_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)

    result = repository.get(user.id, uuid.uuid4())

    assert result is None


def test_user_cannot_get_another_users_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user1 = create_test_user(db_session)
    user2 = create_test_user(db_session)

    deck = create_test_deck(user1.id)

    repository.add(deck)

    result = repository.get(user2.id, deck.id)

    assert result is None


def test_get_all_decks(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)

    deck1 = create_test_deck(user.id, "Computer Science")
    deck2 = create_test_deck(user.id, "Economics")

    repository.add(deck1)
    repository.add(deck2)

    result = repository.get_all(user.id)

    assert len(result) == 2
    assert {deck.deckname for deck in result} == {
        "Computer Science",
        "Economics"
    }


def test_get_all_only_returns_users_decks(db_session):
    repository = PostgresDeckRepository(db_session)

    user1 = create_test_user(db_session)
    user2 = create_test_user(db_session)

    deck1 = create_test_deck(user1.id, "Computer Science")
    deck2 = create_test_deck(user2.id, "Economics")

    repository.add(deck1)
    repository.add(deck2)

    result = repository.get_all(user1.id)

    assert len(result) == 1
    assert result[0].id == deck1.id


def test_save_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)
    deck = create_test_deck(user.id)

    repository.add(deck)

    deck.deckname = "Updated Computer Science"
    deck.description = "Updated description"

    repository.save(deck)

    result = repository.get(user.id, deck.id)

    assert result.deckname == "Updated Computer Science"
    assert result.description == "Updated description"


def test_save_nonexistent_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)
    deck = create_test_deck(user.id)

    try:
        repository.save(deck)
        assert False, "Expected ValueError"
    except ValueError:
        pass


def test_delete_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)
    deck = create_test_deck(user.id)

    repository.add(deck)

    result = repository.delete(deck.id, user.id)

    assert result.rowcount == 1
    assert repository.get(user.id, deck.id) is None


def test_user_cannot_delete_another_users_deck(db_session):
    repository = PostgresDeckRepository(db_session)

    user1 = create_test_user(db_session)
    user2 = create_test_user(db_session)

    deck = create_test_deck(user1.id)

    repository.add(deck)

    result = repository.delete(deck.id, user2.id)

    assert result.rowcount == 0
    assert repository.get(user1.id, deck.id) is not None


def test_exists_by_name(db_session):
    repository = PostgresDeckRepository(db_session)

    user = create_test_user(db_session)
    deck = create_test_deck(user.id, "Computer Science")

    repository.add(deck)

    assert repository.exists_by_name(
        user.id, "Computer Science"
    ) is True

    assert repository.exists_by_name(
        user.id, "Economics"
    ) is False


def test_exists_by_name_is_user_specific(db_session):
    repository = PostgresDeckRepository(db_session)

    user1 = create_test_user(db_session)
    user2 = create_test_user(db_session)

    deck = create_test_deck(user1.id, "Computer Science")

    repository.add(deck)

    assert repository.exists_by_name(
        user2.id, "Computer Science"
    ) is False
