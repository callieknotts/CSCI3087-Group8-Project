from uuid import uuid4

import pytest

from entity.starredcard import StarredCard
from use_case.star.list_starred_cards import ListStarredCards
from use_case.star.star_card import StarCard
from use_case.star.unstar_card import UnstarCard


class FakeStarRepository:
    def __init__(self, owned_card_ids=()):
        self.owned = set(owned_card_ids)
        self.stars = {}  # (user_id, card_id) -> StarredCard
        self.added = []

    def card_owned_by_user(self, user_id, card_id):
        return card_id in self.owned

    def get_by_user_card(self, user_id, card_id):
        return self.stars.get((user_id, card_id))

    def get_all(self, user_id):
        return [s for (u, _), s in self.stars.items() if u == user_id]

    def add(self, star):
        self.stars[(star.user_id, star.card_id)] = star
        self.added.append(star)
        return star

    def delete_by_user_card(self, user_id, card_id):
        return self.stars.pop((user_id, card_id), None) is not None


def test_star_a_card():
    user_id, card_id = uuid4(), uuid4()
    repo = FakeStarRepository(owned_card_ids=[card_id])

    star = StarCard(repo).execute(user_id, card_id)

    assert star.user_id == user_id
    assert star.card_id == card_id
    assert repo.get_by_user_card(user_id, card_id) is star


def test_starring_twice_keeps_one_star():
    user_id, card_id = uuid4(), uuid4()
    repo = FakeStarRepository(owned_card_ids=[card_id])

    first = StarCard(repo).execute(user_id, card_id)
    second = StarCard(repo).execute(user_id, card_id)

    assert second is first
    assert len(repo.added) == 1


def test_cannot_star_a_card_the_user_does_not_own():
    repo = FakeStarRepository()  # owns nothing

    with pytest.raises(ValueError, match="Card not found"):
        StarCard(repo).execute(uuid4(), uuid4())

    assert repo.added == []


def test_unstar_removes_the_star():
    user_id, card_id = uuid4(), uuid4()
    repo = FakeStarRepository(owned_card_ids=[card_id])
    StarCard(repo).execute(user_id, card_id)

    assert UnstarCard(repo).execute(user_id, card_id) is True
    assert repo.get_by_user_card(user_id, card_id) is None


def test_unstar_a_card_that_is_not_starred_is_not_an_error():
    assert UnstarCard(FakeStarRepository()).execute(uuid4(), uuid4()) is False


def test_unstar_only_touches_the_given_users_star():
    mine, theirs, card_id = uuid4(), uuid4(), uuid4()
    repo = FakeStarRepository(owned_card_ids=[card_id])
    repo.add(StarredCard.create(theirs, card_id))

    UnstarCard(repo).execute(mine, card_id)

    assert repo.get_by_user_card(theirs, card_id) is not None


def test_list_returns_only_the_users_stars():
    mine, theirs = uuid4(), uuid4()
    card_a, card_b = uuid4(), uuid4()
    repo = FakeStarRepository()
    repo.add(StarredCard.create(mine, card_a))
    repo.add(StarredCard.create(theirs, card_b))

    stars = ListStarredCards(repo).execute(mine)

    assert [s.card_id for s in stars] == [card_a]
