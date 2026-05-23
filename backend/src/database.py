from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from redis import asyncio as aioredis

from src.config import get_settings

settings = get_settings()

engine = create_async_engine(settings.database_url, echo=False, pool_size=20, max_overflow=10)
async_session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

redis: aioredis.Redis | None = None


async def get_db() -> AsyncSession:
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def get_redis() -> aioredis.Redis:
    global redis
    if redis is None:
        redis = aioredis.from_url(settings.redis_url, decode_responses=True)
    return redis


async def close_redis() -> None:
    global redis
    if redis is not None:
        await redis.close()
        redis = None
