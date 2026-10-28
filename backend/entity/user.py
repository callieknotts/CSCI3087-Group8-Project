from dataclasses import dataclass
from uuid import UUID, uuid4
from datetime import datetime

# class Username:
#     def __init__(self, value: str):
#         if len(value) < 3:
#             raise ValueError("Username too short")

#         if len(value) > 20:
#             raise ValueError("Username too long")

#         self.value = value

# class Password:
#     def __init__(self, value: str):
#         if len(value) < 12:
#             raise ValueError("Password is too short")

#         if not any(c.isupper() for c in value):
#             raise ValueError("Password needs an uppercase letter")

#         if not any(c.isdigit() for c in value):
#             raise ValueError("Password needs a number")

#         self.value = value
# class Email:
#     def __init__(self, value: str):
#         if "@" not in value:
#             raise ValueError("Invalid email")

#         self.value = value

# class Name:
#     def __init__(self, value: str):
#             if "@" not in value:
#                 raise ValueError("Invalid email")
    
#             self.value = value

@dataclass
class User:
    id: UUID
    username: str
    name:str
    email: str
    password_hash: str
    created_at: datetime
    updated_at: datetime


    @classmethod
    def create(cls,
               username: str,
               email: str,
               password_hash: str,
               name: str
               )-> "User":
        return(cls(
            id=uuid4(),
            username=username,
            email=email,
            name=name,
            password_hash=password_hash,
            created_at=datetime.now(),
            # wht does it need parathesizes? explain later 
            updated_at=datetime.now()
            ))



    # def set_username(self, username: str):
    #     self.username=username
    # def changeemail(self, new_email:str)->None:

    
        
        
        
    

