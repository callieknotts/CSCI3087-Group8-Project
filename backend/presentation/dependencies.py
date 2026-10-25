# dependencies.py

from backend.infrastructure.postgres_repositories.userRepo import PostgresUserRepository
from backend.infrastructure.database import SessionLocal

from backend.infrastructure.postgres_repositories.deckRepo import PostgresDeckRepository
def get_user_repository():
    # explain why sessionlocal needs parathesizes
    #we are passing the session factory and not the object which causes it to...
    return PostgresUserRepository(SessionLocal())

def get_deck_repository():

    return PostgresDeckRepository(SessionLocal())
