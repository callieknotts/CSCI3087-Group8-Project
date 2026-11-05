
# test/conftest.py

import os
import sys
from pathlib import Path

import pytest
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

# --------------------------------------------------
# 1. Configure project paths
# --------------------------------------------------

PROJECT_ROOT = Path(__file__).resolve().parent.parent
BACKEND_ROOT = PROJECT_ROOT / "backend"

sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(BACKEND_ROOT))

# --------------------------------------------------
# 2. Load environment variables
# --------------------------------------------------


load_dotenv(PROJECT_ROOT / ".env")

TEST_DATABASE_URL = os.getenv("TEST_DATABASE_URL")

if not TEST_DATABASE_URL:
    raise RuntimeError("TEST_DATABASE_URL is missing")

# Ensure the application also connects to the test database.
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
# --------------------------------------------------
# 3. Import backend modules
# --------------------------------------------------

from infrastructure.database import Base, get_db

# Import models so SQLAlchemy registers their tables.
from infrastructure.models.usermodel import UserModel
from infrastructure.models.deckmodel import DeckModel
from infrastructure.models.subdeckmodel import SubDeckModel

from backend.main import app

# --------------------------------------------------
# 4. Configure test database
# --------------------------------------------------

test_engine = create_engine(
    TEST_DATABASE_URL,
    pool_pre_ping=True
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=test_engine
)

# --------------------------------------------------
# 5. Create and remove test database tables
# --------------------------------------------------

@pytest.fixture(scope="session", autouse=True)
def setup_test_database():
    Base.metadata.create_all(bind=test_engine)

    yield

    Base.metadata.drop_all(bind=test_engine)
    test_engine.dispose()

# --------------------------------------------------
# 6. Database session fixture
# --------------------------------------------------

@pytest.fixture
def db_session(setup_test_database):
    connection = test_engine.connect()
    transaction = connection.begin()

    session = TestingSessionLocal(
        bind=connection,
        join_transaction_mode="create_savepoint"
    )

    try:
        yield session
    finally:
        session.close()
        transaction.rollback()
        connection.close()

# --------------------------------------------------
# 7. FastAPI test client fixture
# --------------------------------------------------

@pytest.fixture
def client(db_session):

    def override_get_db():
        yield db_session

    app.dependency_overrides[get_db] = override_get_db

    try:
        with TestClient(app) as test_client:
            yield test_client
    finally:
        app.dependency_overrides.pop(get_db, None)
