from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from sqlalchemy.exc import IntegrityError

from src.middleware.auth_middleware import get_current_user
from src.models.user import User
from src.schemas.user import UserCreate, UserLogin, UserRead
from src.services.auth_service import AuthService

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register(body: UserCreate):
    try:
        user = await AuthService.register(
            username=body.username,
            email=body.email,
            password=body.password,
        )
        return user
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail=str(e))
    except IntegrityError:
        # Race: a concurrent register call committed first and our
        # pre-check found no row.  The DB unique constraint is the
        # only race-free backstop — surface it as a clean 409.
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already taken",
        )


@router.post("/login")
async def login(body: UserLogin):
    # Resolve the login field. The schema guarantees at least one is set.
    try:
        login_id = body.resolved_login()
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    user = await AuthService.authenticate(login=login_id, password=body.password, mfa_code=body.mfa_code)
    if user is None:
        # Generic message — don't reveal whether the account exists.
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    token = AuthService.create_token(user)
    # Field name compatibility: the frontend's `useAuthStore.login` reads
    # `data.token` (not `data.access_token`).  We return BOTH names so
    # any client of the API (current frontend, future mobile, or a
    # curl-based admin) gets a predictable shape.
    return {
        "access_token": token,
        "token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "username": user.username, "email": user.email, "role": user.role},
    }


@router.get("/me", response_model=UserRead)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/mfa/verify")
async def mfa_verify(code: str):
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="MFA not yet implemented")


@router.post("/oauth/authorize")
async def oauth_authorize(provider: str, code: str):
    raise HTTPException(status_code=status.HTTP_501_NOT_IMPLEMENTED, detail="OAuth not yet implemented")
