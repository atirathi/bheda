"""Under a burst of solves the leaderboard must NOT run a full recompute +
broadcast on every submission. recalculate_if_due throttles to at most one
recompute per interval per event (Redis NX lock)."""
import asyncio

import src.database as db
from src.database import engine
from src.models.base import Base
from src.services.scoring_service import ScoringService


def test_recalc_is_throttled_under_burst():
    async def run():
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)
            await conn.run_sync(Base.metadata.create_all)
        # 12 rapid "solves" hitting the throttle within one interval window.
        results = []
        for _ in range(12):
            results.append(await ScoringService.recalculate_if_due("11111111-1111-1111-1111-111111111111", min_interval=3))
        await db.close_redis()  # close within this loop to avoid teardown errors
        return results

    results = asyncio.run(run())
    recomputed = [r for r in results if r is not None]
    # Exactly one burst member does the heavy recompute; the rest are skipped.
    assert len(recomputed) == 1, f"expected 1 recompute, got {len(recomputed)}"
