# presentation/schemas/user.py
from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    email: EmailStr
    name: str = Field(min_length=2)
    username: str = Field(min_length=5)
    password: str = Field(min_length=8)

    @field_validator("password")
    @classmethod
    def validate_password(cls, password: str) -> str:
        if not any(char.isupper() for char in password):
            raise ValueError("Password must contain an uppercase letter")

        if not any(char.islower() for char in password):
            raise ValueError("Password must contain a lowercase letter")

        if not any(char.isdigit() for char in password):
            raise ValueError("Password must contain a number")

        if not any(not char.isalnum() for char in password):
            raise ValueError("Password must contain a special character")

        return password

class LoginSchema(BaseModel):
    login: str
    password: str = Field(min_length=8)


