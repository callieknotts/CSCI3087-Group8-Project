# from sqlalchemy.sql import func
from backend.infrastructure.database import Base
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
import uuid
from sqlalchemy import UUID, text
from datetime import datetime



class UserModel(Base):
    __tablename__="users"
    id: Mapped[uuid.UUID] = mapped_column(primary_key=True,nullable=False)
    email: Mapped[str] = mapped_column(nullable=False)
    name: Mapped[str] = mapped_column(nullable=False)
    username: Mapped[str] = mapped_column(nullable=False)
    password: Mapped[str] = mapped_column(nullable=False)
    created_at: Mapped[datetime] = mapped_column(nullable=False)
    updated_at: Mapped[datetime] = mapped_column(nullable=False)