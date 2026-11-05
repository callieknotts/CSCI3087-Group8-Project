from fastapi import APIRouter, Depends, Request, HTTPException
from presentation.schemas.user import SignupRequest, LoginSchema
from entity.repo.userRepo import UserRepository
from use_case.signup import CreateUser
from use_case.login import LoginUser
from presentation.dependencies import get_user_repository
from presentation.auth import get_current_user


router = APIRouter(prefix="/users", tags=["users"])


@router.post("/")
def signup(data: SignupRequest,
           repo: UserRepository = Depends(get_user_repository)):

    # ok we write it like CreateUser(repo).execute(data) instead of
    # CreateUser.execute(data,repo) to show the dependency actually
    # it is cleaner to put the repo in the __init__ but not the data
    # what is acted on
    return CreateUser(repo).execute(email=data.email, name=data.name,
                                    username=data.username, password=data.password)


#
# @router.post("/")
# def signup(data: SignupRequest):
#     return {
#         "email": data.email,
#         "name": data.name,
#         "username": data.username,
#         "message": "Validation worked!",
#     }

# @router.get("/{user_id}")
@router.post("/auth/login")
def login_user(
    login: LoginSchema,
    request: Request,
    repo: UserRepository = Depends(get_user_repository),
):
    try:
        result = LoginUser(repo).execute(
            userlogin=login.login,
            password=login.password
        )
    except ValueError:
        raise HTTPException(
            status_code=401,
            detail="Incorrect login credentials"
        )

    request.session["user_id"] = str(result["user_id"])

    return {"message": "Logged in successfully"}


@router.get("/me")
def get_me(
    request: Request,
    repo: UserRepository = Depends(get_user_repository)
):
    # user_id = request.session.get("user_id")

    user = get_current_user(request=request, repo=repo)
    # if user is None:
    #     request.session.clear()
    #     raise HTTPException(
    #         status_code=401,
    #         detail="User no longer exists"
    #     )

    return {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "name": user.name
    }


@router.delete("/logout")
def logout(request: Request):
    if not request.session.get("user_id"):
        raise HTTPException(
            status_code=401,
            detail="Not logged in"
        )

    request.session.clear()

    return {"message": "Logged out successfully"}
