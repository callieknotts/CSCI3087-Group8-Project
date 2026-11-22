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
class UpdateUserSchema(BaseModel):
    name: str | None = Field(default=None, min_length=2)
    email: EmailStr | None = None
    username: str | None = Field(min_length=5)


    # @field_validator(
    #     "name",
    #     "email",
    #     "username",
    #     "back_image",
    #     mode="before"
    # )
    # @classmethod
    # def empty_string_to_none(cls, value):
    #     if value == "":
    #         return None
    #     return value

class LoginSchema(BaseModel):
    login: str
    password: str = Field(min_length=8)
