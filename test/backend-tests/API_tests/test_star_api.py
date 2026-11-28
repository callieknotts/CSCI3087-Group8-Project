import uuid

from fastapi.testclient import TestClient


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def register_user(client: TestClient, username="dylan123",
                  email="dylan@example.com"):
    return client.post(
        "/users/",
        json={
            "name": "Dylan",
            "email": email,
            "username": username,
            "password": "password123P!"
        }
    )


def login_user(client: TestClient, username="dylan123"):
    return client.post(
        "/users/auth/login",
        json={"login": username, "password": "password123P!"}
    )


def setup_authenticated_user(client: TestClient):
    assert register_user(client).status_code == 200
    assert login_user(client).status_code == 200


def create_card(client: TestClient) -> str:
    """Makes a deck with one card for the logged-in user; returns the card id."""
    deck = client.post(
        "/decks/",
        json={"deckname": "Computer Science", "description": "CS"}
    )
    assert deck.status_code == 200
    deck_id = deck.json()["id"]

    client.post(
        f"/decks/{deck_id}/cards/",
        json={"front_text": "front", "back_text": "back", "position": 0}
    )
    cards = client.get(f"/decks/{deck_id}/cards/")
    assert cards.status_code == 200
    return str(cards.json()[0]["id"])


def starred_ids(client: TestClient) -> list[str]:
    response = client.get("/stars/")
    assert response.status_code == 200
    return response.json()["card_ids"]


# --------------------------------------------------
# AUTHENTICATION
# --------------------------------------------------

def test_stars_need_login(client):
    card_id = uuid.uuid4()

    assert client.get("/stars/").status_code == 401
    assert client.put(f"/stars/{card_id}").status_code == 401
    assert client.delete(f"/stars/{card_id}").status_code == 401


# --------------------------------------------------
# STAR / UNSTAR
# --------------------------------------------------

def test_nothing_is_starred_at_first(client):
    setup_authenticated_user(client)

    assert starred_ids(client) == []


def test_star_a_card(client):
    setup_authenticated_user(client)
    card_id = create_card(client)

    response = client.put(f"/stars/{card_id}")

    assert response.status_code == 200
    assert response.json() == {"card_id": card_id, "starred": True}
    assert starred_ids(client) == [card_id]


def test_starring_twice_is_fine_and_keeps_one_star(client):
    setup_authenticated_user(client)
    card_id = create_card(client)

    assert client.put(f"/stars/{card_id}").status_code == 200
    assert client.put(f"/stars/{card_id}").status_code == 200

    assert starred_ids(client) == [card_id]


def test_unstar_a_card(client):
    setup_authenticated_user(client)
    card_id = create_card(client)
    client.put(f"/stars/{card_id}")

    response = client.delete(f"/stars/{card_id}")

    assert response.status_code == 200
    assert response.json() == {"card_id": card_id, "starred": False}
    assert starred_ids(client) == []


def test_unstarring_a_card_that_is_not_starred_is_fine(client):
    setup_authenticated_user(client)
    card_id = create_card(client)

    assert client.delete(f"/stars/{card_id}").status_code == 200


def test_star_a_card_that_does_not_exist(client):
    setup_authenticated_user(client)

    response = client.put(f"/stars/{uuid.uuid4()}")

    assert response.status_code == 404


def test_star_with_an_invalid_id(client):
    setup_authenticated_user(client)

    assert client.put("/stars/not-a-uuid").status_code == 422


# --------------------------------------------------
# STARS BELONG TO ONE USER
# --------------------------------------------------

def test_cannot_star_another_users_card(client):
    setup_authenticated_user(client)
    card_id = create_card(client)

    # switch to a second user (logging in replaces the session)
    register_user(client, username="other456", email="other@example.com")
    assert login_user(client, username="other456").status_code == 200

    assert client.put(f"/stars/{card_id}").status_code == 404
    assert starred_ids(client) == []


def test_stars_are_private_to_each_user(client):
    setup_authenticated_user(client)
    card_id = create_card(client)
    client.put(f"/stars/{card_id}")

    register_user(client, username="other456", email="other@example.com")
    login_user(client, username="other456")
    assert starred_ids(client) == []

    # and the second user un-starring does not remove the first user's star
    client.delete(f"/stars/{card_id}")
    login_user(client)
    assert starred_ids(client) == [card_id]
