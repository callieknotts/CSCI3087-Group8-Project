import uuid
from datetime import datetime, timezone

import pytest
from sqlalchemy.exc import IntegrityError

from entity.starredcard import StarredCard
from infrastructure.models.cardmodel import CardModel
from infrastructure.models.deckmodel import DeckModel
from infrastructure.models.usermodel import UserModel
from infrastructure.postgres_repositories.starredCardRepo import (
    PostgresStarredCardRepository
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


def create_test_card(db_session, user):
    deck = DeckModel(user_id=user.id, deckname="Computer Science")
    db_session.add(deck)
    db_session.flush()

    card = CardModel(
        deck_id=deck.id,
        position=0,
        front_text="front",
        back_text="back"
    )
    db_session.add(card)
    db_session.flush()
    return card


def test_add_and_get_by_user_card(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    card = create_test_card(db_session, user)

    saved = repo.add(StarredCard.create(user.id, card.id))

    found = repo.get_by_user_card(user.id, card.id)
    assert found is not None
    assert found.id == saved.id
    assert found.card_id == card.id


def test_get_by_user_card_returns_none_when_not_starred(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    card = create_test_card(db_session, user)

    assert repo.get_by_user_card(user.id, card.id) is None


def test_the_same_card_cannot_be_starred_twice_by_one_user(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    card = create_test_card(db_session, user)
    repo.add(StarredCard.create(user.id, card.id))

    with pytest.raises(IntegrityError):
        repo.add(StarredCard.create(user.id, card.id))


def test_get_all_only_returns_this_users_stars(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    other = create_test_user(db_session)
    mine = create_test_card(db_session, user)
    theirs = create_test_card(db_session, other)
    repo.add(StarredCard.create(user.id, mine.id))
    repo.add(StarredCard.create(other.id, theirs.id))

    stars = repo.get_all(user.id)

    assert [s.card_id for s in stars] == [mine.id]


def test_delete_by_user_card(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    card = create_test_card(db_session, user)
    repo.add(StarredCard.create(user.id, card.id))

    assert repo.delete_by_user_card(user.id, card.id) is True
    assert repo.get_by_user_card(user.id, card.id) is None
    assert repo.delete_by_user_card(user.id, card.id) is False


def test_card_owned_by_user(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    other = create_test_user(db_session)
    card = create_test_card(db_session, user)

    assert repo.card_owned_by_user(user.id, card.id) is True
    assert repo.card_owned_by_user(other.id, card.id) is False
    assert repo.card_owned_by_user(user.id, uuid.uuid4()) is False


def test_checking_ownership_does_not_touch_the_deck(db_session):
    # DeckRepository.get bumps last_opened_at; starring must not.
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    card = create_test_card(db_session, user)
    deck = db_session.get(DeckModel, card.deck_id)
    opened_before = deck.last_opened_at

    repo.card_owned_by_user(user.id, card.id)
    db_session.refresh(deck)

    assert deck.last_opened_at == opened_before


def test_deleting_the_card_removes_its_stars(db_session):
    repo = PostgresStarredCardRepository(db_session)
    user = create_test_user(db_session)
    card = create_test_card(db_session, user)
    repo.add(StarredCard.create(user.id, card.id))

    db_session.delete(card)
    db_session.flush()
    db_session.expire_all()

    assert repo.get_all(user.id) == []
