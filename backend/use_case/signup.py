from backend.entity.user import User
from backend.entity.repo.userRepo import UserRepository
from backend.infrastructure.security.password_hasher import HashPassword
class CreateUser:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        self.hash_password= HashPassword

    def execute(
        self,
        email: str,
        name: str,
        username: str,
        password: str
    ) -> User:
        if self.user_repo.exists_by_username(username):
            raise ValueError()
            # raise UsernameAlreadyExists()
        if self.user_repo.exists_by_email(email):
            raise ValueError()
            # raise EmailAlreadyExists()
        
        h=self.hash_password.hash(password)
        
        user=User.create(email=email,username=username,password_hash=h,name=name)       
        self.user_repo.add(user)
        return user