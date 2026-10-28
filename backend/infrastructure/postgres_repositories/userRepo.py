from sqlalchemy.orm import Session
from backend.entity.user import User
from sqlalchemy import select
#explain select
from backend.entity.repo.userRepo import UserRepository
from backend.infrastructure.models.usermodel import UserModel
from uuid import UUID
class PostgresUserRepository(UserRepository):
    def __init__(self, session: Session):
        self.session = session

    def _to_domain(self,model:UserModel)->User:
        return User(
            id=model.id,
            email=model.email,
            name=model.name,
            password_hash=model.password,
            username=model.username,
            created_at=model.created_at,
            updated_at=model.updated_at
        )
    def _to_model(self, user:User)->UserModel:
        return UserModel(
            id=user.id,
            email=user.email,
            name=user.name,
            username=user.username,
            password=user.password_hash,
            created_at=user.created_at,
            updated_at=user.updated_at
        )

    def add(self, user: User) -> User:
        model = self._to_model(user)
        self.session.add(model)
        self.session.commit()
        return user

    def save(self, user: User) -> User:
        """Explicitly update an existing user record."""
        model = self.session.get(UserModel, user.id)
        if not model:
            raise ValueError(f"User with id {user.id} not found for update.")
        
        model.email = user.email
        model.name = user.name
        model.username = user.username
        model.password = user.password
        model.updated_at = user.updated_at
        
        self.session.commit()
        return user

    def get_all(self):
        models = self.session.query(UserModel).all()
        return [
            self._to_domain(m) for m in models
        ]

    def get(self, user_id: UUID) -> User | None:
        model = self.session.get(UserModel, user_id)
        if not model:
            return None
        return self._to_domain(model)
    # def exists_by_username(self, username:str)-> User | None:
    #     model = self.session.get(UserModel, username)
    #     if not model:
    #         return None
    #     return self._to_domain(model)
    # gets by primary which we do not want so we need a different get

    def exists_by_username(self, username: str) -> bool:
        stmt = select(UserModel).where(
            UserModel.username == username
        )

        return self.session.scalar(stmt) is not None

    def exists_by_email(self, email: str) -> bool:
        stmt = select(UserModel).where(
            UserModel.email == email
        )

        return self.session.scalar(stmt) is not None
    def get_by_username(self, username:str)-> User| None:
        stmt = select(UserModel).where(
                    UserModel.username == username
                )
        
        return self._to_domain(self.session.scalar(stmt))
    def get_by_email(self, email:str)-> User| None:
        stmt = select(UserModel).where(
                    UserModel.email == email
                )
        
        return self._to_domain(self.session.scalar(stmt))
    
    # def get_by_id(self, user_id: int) -> User | None:

    #     return (
    #         self.session.query(User)
    #         .filter(User.id == user_id)
    #         .first()
    #     )
    

