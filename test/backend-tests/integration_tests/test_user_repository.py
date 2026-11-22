
import uuid
from datetime import datetime, timezone

from entity.user import User

# Adjust this import to your actual repository filename.
from infrastructure.postgres_repositories.userRepo import (
    PostgresUserRepository
)


def create_test_user():
    return User(
        id=uuid.uuid4(),
        name="Dylan",
        email="dylan@example.com",
        username="dylan123",
        password_hash="hashed_password1!P",
        created_at=datetime.now(timezone.utc),
        updated_at=datetime.now(timezone.utc)
    )


def test_add_user(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    result = repository.add(user)

    assert result.id == user.id

    saved_user = repository.get(user.id)

    assert saved_user is not None
    assert saved_user.email == "dylan@example.com"
    assert saved_user.username == "dylan123"


def test_get_user(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    repository.add(user)

    result = repository.get(user.id)

    assert result is not None
    assert result.id == user.id
    assert result.username == user.username


def test_get_nonexistent_user(db_session):
    repository = PostgresUserRepository(db_session)

    result = repository.get(uuid.uuid4())

    assert result is None


def test_get_by_username(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    repository.add(user)

    result = repository.get_by_username("dylan123")

    assert result is not None
    assert result.id == user.id
    assert result.username == "dylan123"


def test_get_by_nonexistent_username(db_session):
    repository = PostgresUserRepository(db_session)

    result = repository.get_by_username("doesnotexist")

    assert result is None


def test_get_by_email(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    repository.add(user)

    result = repository.get_by_email("dylan@example.com")

    assert result is not None
    assert result.id == user.id
    assert result.email == "dylan@example.com"


def test_get_by_nonexistent_email(db_session):
    repository = PostgresUserRepository(db_session)

    result = repository.get_by_email("missing@example.com")

    assert result is None


def test_exists_by_username(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    repository.add(user)

    assert repository.exists_by_username("dylan123") is True
    assert repository.exists_by_username("unknown") is False


def test_exists_by_email(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    repository.add(user)

    assert repository.exists_by_email("dylan@example.com") is True
    assert repository.exists_by_email("unknown@example.com") is False


def test_get_all_users(db_session):
    repository = PostgresUserRepository(db_session)

    user1 = create_test_user()

    user2 = create_test_user()
    user2.email = "another@example.com"
    user2.username = "anotheruser"

    repository.add(user1)
    repository.add(user2)

    result = repository.get_all()

    assert len(result) == 2
    assert {user.username for user in result} == {
        "dylan123",
        "anotheruser"
    }


def test_save_user(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()
    repository.add(user)

    user.name = "Updated Dylan"
    user.email = "updated@example.com"
    user.username = "updated123"
    user.password_hash = "new_hashed_password"
    user.updated_at = datetime.now(timezone.utc)

    repository.save(user)

    result = repository.get(user.id)

    assert result.name == "Updated Dylan"
    assert result.email == "updated@example.com"
    assert result.username == "updated123"
    assert result.password_hash == "new_hashed_password"


def test_save_nonexistent_user(db_session):
    repository = PostgresUserRepository(db_session)

    user = create_test_user()

    try:
        repository.save(user)
        assert False, "Expected ValueError"
    except ValueError:
        pass
