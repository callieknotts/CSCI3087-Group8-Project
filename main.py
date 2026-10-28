from fastapi import FastAPI

from backend.presentation.api.user import router as signup_router
from backend.presentation.api.deck import router as deck_router

from backend.infrastructure.database import Base, engine
from starlette.middleware.sessions import SessionMiddleware
import os
app = FastAPI()
# for devolpment i need the table to be created but this does not need to exist in the final
Base.metadata.create_all(bind=engine)

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET"),
    session_cookie="session",
    max_age=3600,
    same_site="lax",
    https_only=False,
)
app.include_router(signup_router)
app.include_router(deck_router)
