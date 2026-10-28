from abc import ABC, abstractmethod
from typing import List, Optional
from backend.entity.user import User
class UserRepository(ABC):
    @abstractmethod
    def save(self, user):
        pass
    @abstractmethod
    def add(user: User):
        pass
    @abstractmethod
    def get(self,user_id):
        pass
    @abstractmethod
    def get_all(self):
        pass
    @abstractmethod
    def exists_by_username(self, username:str):
        pass
    @abstractmethod
    def exists_by_email(self, email:str):
        pass
    @abstractmethod
    def get_by_username(self, username:str):
        pass
    @abstractmethod
    def get_by_email(self, email:str):
        pass



# from sqlalchemy.orm import Session
# from backend.entity.user import User
# from backend.entity.repo.userRepo import UserRepository
# from backend.infrastructure.usermodel import UserModel
# from uuid import UUID
# class UserRepo(UserRepository):
#     def __init__(self, session: Session):
#         self.session = session

#     def _to_domain(self,model:UserModel)->User:
#         return User(
#             id=model.id,
#             email=model.email,
#             name=model.name,
#             password_hash=model.password,
#             username=model.username,
#             created_at=model.created_at,
#             updated_at=model.updated_at
#         )
#     def _to_model(self, user:User)->UserModel:
#         return UserModel(
#             id=user.id,
#             email=user.email,
#             name=user.name,
#             username=user.username,
#             password_hash=user.password,
#             created_at=user.created_at,
#             updated_at=user.updated_at
#         )

#     def add(self, user: User) -> User:
#         model = self._to_model(user)
#         self.session.add(model)
#         self.session.commit()
#         return user

#     def save(self, user: User) -> User:
#         """Explicitly update an existing user record."""
#         model = self.session.get(UserModel, user.id)
#         if not model:
#             raise ValueError(f"User with id {user.id} not found for update.")
        
#         model.email = user.email
#         model.name = user.name
#         model.username = user.username
#         model.password = user.password
#         model.updated_at = user.updated_at
        
#         self.session.commit()
#         return user

#     def get_all(self):
#         models = self.session.query(UserModel).all()
#         return [
#             self._to_domain(m) for m in models
#         ]

#     def get(self, user_id: UUID) -> User | None:
#         model = self.session.get(UserModel, user_id)
#         if not model:
#             return None
#         return self._to_domain(model)
#     def exists_by_username(self, username:str):
#         model = self.session.get(UserModel, username)
#         if not model:
#             return None
#         return self._to_domain(model)
#     def exists_by_email(self, email:str):
#         model = self.session.get(UserModel, email)
#         if not model:
#             return None
#         return self._to_domain(model)
    
    

