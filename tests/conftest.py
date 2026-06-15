import os
import secrets
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://bheda:bheda@localhost:5432/bheda")
os.environ.setdefault("REDIS_URL", "redis://localhost:6379/0")
os.environ.setdefault("SECRET_KEY", secrets.token_hex(32))
os.environ.setdefault("API_KEY", secrets.token_hex(24))
os.environ.setdefault("FLAG_SECRET", "test_flag_secret_at_least_32_chars_long_xx")


import asyncio as _asyncio

import pytest as _pytest


@_pytest.fixture(autouse=True)
def _dispose_engine_between_tests():
    """Each test uses its own asyncio.run() loop. The module-level async
    engine pools connections bound to the loop that first used them, so
    dispose before each test to force a fresh pool on the new loop. Same
    for the redis singleton — null it so get_redis() rebinds to the new
    loop instead of reusing a client tied to a closed one."""
    import src.database as db
    _asyncio.run(db.engine.dispose())
    db.redis = None
    yield
