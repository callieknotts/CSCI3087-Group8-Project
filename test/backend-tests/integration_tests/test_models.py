
import uuid

import pytest
from sqlalchemy.exc import IntegrityError

from infrastructure.models.usermodel import UserModel
from infrastructure.models.deckmodel import DeckModel


# --------------------------------------------------
# Helpers
# --------------------------------------------------

def create_user(db_session, username="dylan123", email="dylan@example.com"):
    user = UserModel(
        name="Dylan",
        email=email,
        username=username,
        password="hashed_password"
    )

    db_session.add(user)
    db_session.flush()

    return user


# --------------------------------------------------
# UserModel tests
# --------------------------------------------------

def test_create_user(db_session):
    user = create_user(db_session)

    assert user.id is not None
    assert isinstance(user.id, uuid.UUID)
    assert user.username == "dylan123"
    assert user.email == "dylan@example.com"
    assert user.created_at is not None
    assert user.updated_at is not None


def test_user_email_must_be_unique(db_session):
    create_user(db_session)

    duplicate = UserModel(
        name="Another User",
        email="dylan@example.com",
        username="anotheruser",
        password="hashed_password"
    )

    db_session.add(duplicate)

    with pytest.raises(IntegrityError):
        db_session.flush()


def test_user_username_must_be_unique(db_session):
    create_user(db_session)

    duplicate = UserModel(
        name="Another User",
        email="another@example.com",
        username="dylan123",
        password="hashed_password"
    )

    db_session.add(duplicate)

    with pytest.raises(IntegrityError):
        db_session.flush()


# --------------------------------------------------
# DeckModel tests
# --------------------------------------------------

def test_create_deck(db_session):
    user = create_user(db_session)

    deck = DeckModel(
        deckname="Computer Science",
        description="CS flashcards",
        user_id=user.id
    )

    db_session.add(deck)
    db_session.flush()

    assert deck.id is not None
    assert isinstance(deck.id, uuid.UUID)
    assert deck.deckname == "Computer Science"
    assert deck.description == "CS flashcards"
    assert deck.user_id == user.id
    assert deck.created_at is not None


def test_deck_can_have_null_description(db_session):
    user = create_user(db_session)

    deck = DeckModel(
        deckname="Economics",
        description=None,
        user_id=user.id
    )

    db_session.add(deck)
    db_session.flush()

    assert deck.description is None


def test_deck_requires_existing_user(db_session):
    deck = DeckModel(
        deckname="Computer Science",
        description="CS flashcards",
        user_id=uuid.uuid4()
    )

    db_session.add(deck)

    with pytest.raises(IntegrityError):
        db_session.flush()
