# dependencies.py

from infrastructure.postgres_repositories.userRepo import PostgresUserRepository
from infrastructure.postgres_repositories.deckRepo import PostgresDeckRepository
from infrastructure.postgres_repositories.subdeckRepo import PostgresSubDeckRepository

from infrastructure.database import get_db
from fastapi import Depends
from sqlalchemy.orm import Session


def get_user_repository(db: Session = Depends(get_db)):
    # explain why sessionlocal needs parathesizes
    #we are passing the session factory and not the object which causes it to...
    return PostgresUserRepository(db)

def get_deck_repository(db: Session = Depends(get_db)):

    return PostgresDeckRepository(db)

def get_sub_deck_repository(db: Session = Depends(get_db)):

    return PostgresSubDeckRepository(db)

