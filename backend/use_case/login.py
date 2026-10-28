from backend.entity.user import User
# from ..infrastructure.repositories.userRepo import UserRepository
from backend.entity.repo.userRepo import UserRepository
from backend.infrastructure.security.password_hasher import HashPassword

class LoginUser:
    def __init__(self, user_repo: UserRepository):
        self.user_repo = user_repo
        self.hash_password=HashPassword

    def execute(self,
        userlogin: str,
        password: str
    ):
        if self.user_repo.exists_by_username(userlogin):
            user=self.user_repo.get_by_username(userlogin)

            if self.hash_password.verify(entered_pw=password,hashed_user_pw=user.password_hash):
                return {
                            "message": "Logged in",
                            "user_id": user.id
                        }
            else:
                raise ValueError("Incorrect Login credentials (in this case password)")
            
                    # raise UsernameAlreadyExists()
        elif self.user_repo.exists_by_email(userlogin):
            user=self.user_repo.get_by_email(userlogin)
            if self.hash_password.verify(entered_pw=password,hashed_user_pw=user.password_hash):
                return {
                            "message": "Logged in",
                            "user_id": user.id
                        }
            else:
                raise ValueError("Incorrect Login credentials (in this case password)")
        
        raise ValueError("Incorrect login credentials (not a username or email)")
        

