"""Run the real seeder against the DB and confirm every challenge YAML
is loaded (no silent drops from unmapped directories)."""
import asyncio
import pathlib

from src.database import engine
from src.models.base import Base
from src.services import seed_service

CHALLENGES = pathlib.Path(__file__).resolve().parents[1] / "challenges"


def test_seeder_loads_all_yaml_challenges():
    async def run():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        return await seed_service.seed_challenges()

    seeded = asyncio.run(run())
    expected = len(list(CHALLENGES.rglob("*.yaml")))
    assert seeded == expected, f"seeded {seeded} of {expected} YAML challenges"
