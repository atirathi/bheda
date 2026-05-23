from datetime import datetime, timedelta, timezone

import bcrypt
import jwt
from sqlalchemy import select

from src.config import get_settings
from src.database import async_session_factory
from src.models.user import User

settings = get_settings()


class AuthService:

    @staticmethod
    async def register(username: str, email: str, password: str) -> User:
        password_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
        async with async_session_factory() as session:
            existing = await session.execute(
                select(User).where((User.username == username) | (User.email == email))
            )
            if existing.scalar_one_or_none():
                raise ValueError("Username or email already taken")
            user = User(username=username, email=email, password_hash=password_hash)
            session.add(user)
            await session.commit()
            await session.refresh(user)
            return user

    @staticmethod
    async def authenticate(username: str, password: str) -> User | None:
        async with async_session_factory() as session:
            result = await session.execute(
                select(User).where(User.username == username)
            )
            user = result.scalar_one_or_none()
            if user is None:
                return None
            if not bcrypt.checkpw(password.encode(), user.password_hash.encode()):
                return None
            user.last_login = datetime.now(timezone.utc)
            await session.commit()
            return user

    @staticmethod
    def create_token(user: User) -> str:
        payload = {
            "sub": str(user.id),
            "username": user.username,
            "role": user.role,
            "iat": datetime.now(timezone.utc),
            "exp": datetime.now(timezone.utc) + timedelta(minutes=settings.jwt_expire_minutes),
        }
        return jwt.encode(payload, settings.secret_key, algorithm=settings.jwt_algorithm)

    @staticmethod
    async def verify_token(token: str) -> User | None:
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.jwt_algorithm])
            user_id = payload.get("sub")
            if user_id is None:
                return None
            async with async_session_factory() as session:
                result = await session.execute(
                    select(User).where(User.id == user_id)
                )
                return result.scalar_one_or_none()
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None
