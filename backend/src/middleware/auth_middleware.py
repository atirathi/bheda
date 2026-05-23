from collections.abc import Awaitable, Callable

from fastapi import Depends, HTTPException, Request, Response, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from src.services.auth_service import AuthService

security = HTTPBearer(auto_error=False)


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
):
    token = credentials.credentials if credentials else request.cookies.get("access_token")
    if not token:
        if hasattr(request.state, "user"):
            return request.state.user
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    user = await AuthService.verify_token(token)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    if user.is_banned:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is banned")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User is inactive")
    request.state.user = user
    return user


async def require_admin(user=Depends(get_current_user)):
    if user.role != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def create_auth_middleware() -> Callable[[Request, Callable[..., Awaitable[Response]]], Awaitable[Response]]:
    async def auth_middleware(request: Request, call_next: Callable[..., Awaitable[Response]]) -> Response:
        auth_header = request.headers.get("Authorization")
        token = None
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header[7:]
        if not token:
            token = request.cookies.get("access_token")
        if token:
            try:
                user = await AuthService.verify_token(token)
                if user and not user.is_banned and user.is_active:
                    request.state.user = user
            except Exception:
                pass
        return await call_next(request)
    return auth_middleware
