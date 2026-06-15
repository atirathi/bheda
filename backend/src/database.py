from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from redis import asyncio as aioredis

from src.config import get_settings

settings = get_settings()

# Each uvicorn worker gets its own pool, so the cluster-wide connection
# count is WEB_CONCURRENCY * (pool_size + max_overflow). Keep that product
# (plus the vuln-app/ctf-engine pools) under Postgres `max_connections`, or
# workers get "FATAL: too many connections" under load. Tunable via env.
engine = create_async_engine(
    settings.database_url,
    echo=False,
    pool_size=settings.db_pool_size,
    max_overflow=settings.db_max_overflow,
    pool_pre_ping=True,   # drop dead connections instead of erroring mid-request
    pool_timeout=settings.db_pool_timeout,
)
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
        # aclose() is the non-deprecated async close (redis-py >= 5.0.1).
        if hasattr(redis, "aclose"):
            await redis.aclose()
        else:
            await redis.close()
        redis = None
