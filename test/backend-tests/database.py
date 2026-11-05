
from sqlalchemy import text


def test_database_connection(client):
    # The client fixture ensures the test database exists
    from conftest import test_engine

    with test_engine.connect() as connection:
        result = connection.execute(text("SELECT 1"))

    assert result.scalar() == 1
