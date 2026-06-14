# Backend tests

Logic/integration tests for scoring and the leaderboard. They run against
a real Postgres + Redis (the production drivers, not sqlite) since the
models use Postgres-specific column types (UUID, JSONB).

## Run

```bash
# 1. Start throwaway Postgres + Redis
docker run -d --name bheda-test-pg    -e POSTGRES_USER=bheda -e POSTGRES_PASSWORD=bheda \
  -e POSTGRES_DB=bheda -p 55432:5432 postgres:16.4-alpine
docker run -d --name bheda-test-redis -p 56379:6379 redis:7.4-alpine

# 2. Install test deps
python3 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt pytest pytest-asyncio greenlet

# 3. Run
DATABASE_URL="postgresql+asyncpg://bheda:bheda@localhost:55432/bheda" \
REDIS_URL="redis://localhost:56379/0" \
  .venv/bin/python -m pytest tests/ -q
```

## What's covered
- `test_scoring.py` — canonical difficulty/chain/first-blood multipliers
  (must match `ctf-engine/src/scoring.ts`).
- `test_leaderboard.py` — stored-score ranking, re-solve dedup, tiebreak.
- `test_submit_flow.py` — first blood, second solver, idempotent re-solve.
