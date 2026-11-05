# test/api/test_deck_api.py

import uuid

import pytest
from fastapi.testclient import TestClient


# --------------------------------------------------
# HELPER FUNCTIONS
# --------------------------------------------------

def register_user(
    client: TestClient,
    username: str = "dylan123",
    email: str = "dylan@example.com"
):
    return client.post(
        "/users/",
        json={
            "name": "Dylan",
            "email": email,
            "username": username,
            "password": "password123P!"
        }
    )


def login_user(
    client: TestClient,
    username: str = "dylan123"
):
    return client.post(
        "/users/auth/login",
        json={
            "login": username,
            "password": "password123P!"
        }
    )


def setup_authenticated_user(client: TestClient):
    register_response = register_user(client)

    print("REGISTER:", register_response.status_code)
    print("REGISTER RESPONSE:", register_response.json())

    assert register_response.status_code == 200

    login_response = login_user(client)

    print("LOGIN:", login_response.status_code)
    print("LOGIN RESPONSE:", login_response.json())

    assert login_response.status_code == 200

def create_deck(client: TestClient):
    return client.post(
        "/decks/",
        json={
            "deckname": "Computer Science",
            "description": "CS flashcards"
        }
    )


# --------------------------------------------------
# AUTHENTICATION
# --------------------------------------------------

def test_get_decks_without_login(client):
    response = client.get("/decks/")

    assert response.status_code == 401


def test_create_deck_without_login(client):
    response = create_deck(client)

    assert response.status_code == 401


def test_update_deck_without_login(client):
    response = client.patch(
        f"/decks/{uuid.uuid4()}",
        json={"deckname": "Updated"}
    )

    assert response.status_code == 401


def test_delete_deck_without_login(client):
    response = client.delete(f"/decks/{uuid.uuid4()}")

    assert response.status_code == 401


# --------------------------------------------------
# CREATE DECK
# --------------------------------------------------

def test_create_deck_success(client):
    setup_authenticated_user(client)

    response = create_deck(client)

    assert response.status_code == 200

    data = response.json()

    assert data["deckname"] == "Computer Science"
    assert data["description"] == "CS flashcards"
    assert "id" in data


def test_create_deck_invalid_data(client):
    setup_authenticated_user(client)

    response = client.post(
        "/decks/",
        json={
            "description": "Missing deck name"
        }
    )

    assert response.status_code == 422


def test_create_deck_missing_description(client):
    setup_authenticated_user(client)

    response = client.post(
        "/decks/",
        json={
            "deckname": "Computer Science"
        }
    )

    # Description should be optional if DeckSchema allows it.
    assert response.status_code == 200

    data = response.json()
    assert data["deckname"] == "Computer Science"


# --------------------------------------------------
# GET DECKS
# --------------------------------------------------

def test_get_decks(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    assert create_response.status_code == 200

    response = client.get("/decks/")

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["deckname"] == "Computer Science"
    assert data[0]["description"] == "CS flashcards"


def test_get_decks_empty(client):
    setup_authenticated_user(client)

    response = client.get("/decks/")

    assert response.status_code == 200
    assert response.json() == []


def test_get_multiple_decks(client):
    setup_authenticated_user(client)

    client.post(
        "/decks/",
        json={
            "deckname": "Computer Science",
            "description": "CS flashcards"
        }
    )

    client.post(
        "/decks/",
        json={
            "deckname": "Economics",
            "description": "Economics flashcards"
        }
    )

    response = client.get("/decks/")

    assert response.status_code == 200
    assert len(response.json()) == 2


# --------------------------------------------------
# UPDATE DECK
# --------------------------------------------------

def test_update_deck(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    assert create_response.status_code == 200

    deck_id = create_response.json()["id"]

    response = client.patch(
        f"/decks/{deck_id}",
        json={
            "deckname": "Advanced Computer Science",
            "description": "Updated CS flashcards"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["deckname"] == "Advanced Computer Science"
    assert data["description"] == "Updated CS flashcards"


def test_update_only_deckname(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    deck_id = create_response.json()["id"]

    response = client.patch(
        f"/decks/{deck_id}",
        json={
            "deckname": "Advanced Computer Science"
        }
    )

    assert response.status_code == 200

    data = response.json()

    assert data["deckname"] == "Advanced Computer Science"

    # The description should remain unchanged.
    assert data["description"] == "CS flashcards"


def test_update_only_description(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    deck_id = create_response.json()["id"]

    response = client.patch(
        f"/decks/{deck_id}",
        json={
            "description": "New description"
        }
    )

    assert response.status_code == 200

    data = response.json()

    # The deck name should remain unchanged.
    assert data["deckname"] == "Computer Science"
    assert data["description"] == "New description"


def test_update_description_to_none(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    deck_id = create_response.json()["id"]

    response = client.patch(
        f"/decks/{deck_id}",
        json={
            "description": None
        }
    )

    assert response.status_code == 200
    assert response.json()["description"] is None


def test_update_deck_with_empty_body(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    deck_id = create_response.json()["id"]

    response = client.patch(
        f"/decks/{deck_id}",
        json={}
    )

    assert response.status_code == 400


def test_update_deck_invalid_uuid(client):
    setup_authenticated_user(client)

    response = client.patch(
        "/decks/not-a-uuid",
        json={"deckname": "Updated"}
    )

    assert response.status_code == 422


def test_update_nonexistent_deck(client):
    setup_authenticated_user(client)

    response = client.patch(
        f"/decks/{uuid.uuid4()}",
        json={"deckname": "Updated"}
    )

    assert response.status_code == 404


# --------------------------------------------------
# DELETE DECK
# --------------------------------------------------

def test_delete_deck(client):
    setup_authenticated_user(client)

    create_response = create_deck(client)
    deck_id = create_response.json()["id"]

    response = client.delete(f"/decks/{deck_id}")

    assert response.status_code == 200

    decks_response = client.get("/decks/")

    assert decks_response.status_code == 200
    assert decks_response.json() == []


def test_delete_deck_invalid_uuid(client):
    setup_authenticated_user(client)

    response = client.delete("/decks/not-a-uuid")

    assert response.status_code == 422


def test_delete_nonexistent_deck(client):
    setup_authenticated_user(client)

    response = client.delete(f"/decks/{uuid.uuid4()}")

    # Adjust this expectation if your API returns 404 for missing decks.
    assert response.status_code == 200


# --------------------------------------------------
# USER OWNERSHIP
# --------------------------------------------------

def test_users_cannot_see_each_others_decks(client):
    # User 1 creates a deck.
    setup_authenticated_user(client)

    create_response = create_deck(client)
    assert create_response.status_code == 200

    deck_id = create_response.json()["id"]

    # Log out user 1.
    logout_response = client.delete("/users/logout")
    assert logout_response.status_code == 200

    # Register and log in user 2.
    register_response = register_user(
        client,
        username="anotheruser",
        email="another@example.com"
    )
    assert register_response.status_code == 200

    login_response = login_user(client, "anotheruser")
    assert login_response.status_code == 200

    # User 2 cannot see user 1's deck.
    response = client.get("/decks/")

    assert response.status_code == 200
    assert response.json() == []

    # User 2 attempts to delete user 1's deck.
    delete_response = client.delete(f"/decks/{deck_id}")

    assert delete_response.status_code == 200

    # Log out user 2.
    client.delete("/users/logout")

    # Log back in as user 1.
    login_response = login_user(client, "dylan123")
    assert login_response.status_code == 200

    # User 1's deck should still exist.
    owner_response = client.get("/decks/")

    assert owner_response.status_code == 200
    assert len(owner_response.json()) == 1
    assert owner_response.json()[0]["id"] == deck_id


def test_users_cannot_update_each_others_decks(client):
    # User 1 creates a deck.
    setup_authenticated_user(client)

    create_response = create_deck(client)
    deck_id = create_response.json()["id"]

    # Log out user 1 and register user 2.
    client.delete("/users/logout")

    register_response = register_user(
        client,
        username="anotheruser",
        email="another@example.com"
    )
    assert register_response.status_code == 200

    login_response = login_user(client, "anotheruser")
    assert login_response.status_code == 200

    # User 2 attempts to update user 1's deck.
    response = client.patch(
        f"/decks/{deck_id}",
        json={"deckname": "Hacked deck"}
    )

    assert response.status_code == 404

    # Log back in as user 1 and verify the original deck is unchanged.
    client.delete("/users/logout")
    login_user(client, "dylan123")

    owner_response = client.get("/decks/")

    assert owner_response.status_code == 200
    assert owner_response.json()[0]["deckname"] == "Computer Science"