from types import SimpleNamespace
from uuid import uuid4

import pytest

from infrastructure.security.password_hasher import HashPassword
from use_case.login import LoginUser
from use_case.signup import CreateUser


class FakeUserRepository:
    def __init__(self, users=None):
        self.users = list(users or [])
        self.added_users = []

    def exists_by_username(self, username):
        return any(user.username == username for user in self.users)

    def exists_by_email(self, email):
        return any(user.email == email for user in self.users)

    def add(self, user):
        self.users.append(user)
        self.added_users.append(user)
        return user

    def get_by_username(self, username):
        return next(
            (user for user in self.users if user.username == username),
            None,
        )

    def get_by_email(self, email):
        return next(
            (user for user in self.users if user.email == email),
            None,
        )


def existing_user(username="student1", email="student@example.com"):
    return SimpleNamespace(
        id=uuid4(),
        username=username,
        email=email,
        password_hash="stored-hash",
    )


def test_signup_creates_user_and_stores_password_hash(monkeypatch):
    repository = FakeUserRepository()
    monkeypatch.setattr(
        HashPassword,
        "hash",
        staticmethod(lambda password: f"hashed:{password}"),
    )

    result = CreateUser(repository).execute(
        email="student@example.com",
        name="Student One",
        username="student1",
        password="PlainPassword1!",
    )

    assert result in repository.added_users
    assert result.email == "student@example.com"
    assert result.username == "student1"
    assert result.name == "Student One"
    assert result.password_hash == "hashed:PlainPassword1!"


def test_signup_rejects_existing_username(monkeypatch):
    repository = FakeUserRepository([existing_user()])
    monkeypatch.setattr(
        HashPassword,
        "hash",
        staticmethod(lambda password: pytest.fail("Password should not be hashed")),
    )

    with pytest.raises(ValueError):
        CreateUser(repository).execute(
            email="different@example.com",
            name="Another Student",
            username="student1",
            password="PlainPassword1!",
        )

    assert repository.added_users == []


def test_signup_rejects_existing_email():
    repository = FakeUserRepository([existing_user()])

    with pytest.raises(ValueError):
        CreateUser(repository).execute(
            email="student@example.com",
            name="Another Student",
            username="student2",
            password="PlainPassword1!",
        )

    assert repository.added_users == []


def test_login_accepts_username_and_correct_password(monkeypatch):
    user = existing_user()
    repository = FakeUserRepository([user])
    monkeypatch.setattr(
        HashPassword,
        "verify",
        staticmethod(lambda entered_pw, hashed_user_pw: (
            entered_pw == "CorrectPassword1!" and hashed_user_pw == "stored-hash"
        )),
    )

    result = LoginUser(repository).execute("student1", "CorrectPassword1!")

    assert result["message"] == "Logged in"
    assert result["user_id"] == user.id


def test_login_accepts_email_and_correct_password(monkeypatch):
    user = existing_user()
    repository = FakeUserRepository([user])
    monkeypatch.setattr(
        HashPassword,
        "verify",
        staticmethod(lambda entered_pw, hashed_user_pw: entered_pw == "CorrectPassword1!"),
    )

    result = LoginUser(repository).execute(
        "student@example.com", "CorrectPassword1!"
    )

    assert result["user_id"] == user.id


def test_login_rejects_incorrect_password(monkeypatch):
    repository = FakeUserRepository([existing_user()])
    monkeypatch.setattr(
        HashPassword,
        "verify",
        staticmethod(lambda entered_pw, hashed_user_pw: False),
    )

    with pytest.raises(ValueError, match="Incorrect Login credentials"):
        LoginUser(repository).execute("student1", "WrongPassword1!")


def test_login_rejects_unknown_username_or_email():
    repository = FakeUserRepository()

    with pytest.raises(ValueError, match="Incorrect login credentials"):
        LoginUser(repository).execute("unknown", "AnyPassword1!")
