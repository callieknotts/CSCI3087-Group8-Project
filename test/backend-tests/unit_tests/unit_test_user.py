import uuid
from datetime import datetime

from entity.user import User


def test_create_user_assigns_an_id_and_timestamps():
    user = User.create(
        username="student1",
        email="student@example.com",
        password_hash="hashed-password",
        name="Student One",
    )

    assert isinstance(user.id, uuid.UUID)
    assert user.username == "student1"
    assert user.email == "student@example.com"
    assert user.name == "Student One"
    assert user.password_hash == "hashed-password"
    assert isinstance(user.created_at, datetime)
    assert isinstance(user.updated_at, datetime)


def test_each_created_user_gets_a_different_id():
    first = User.create("student1", "one@example.com", "hash1", "Student One")
    second = User.create("student2", "two@example.com", "hash2", "Student Two")

    assert first.id != second.id
