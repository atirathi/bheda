#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "╔══════════════════════════════════════════════════╗"
echo "║         Bheda — Full Environment Reset          ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""
echo "WARNING: This will destroy all containers, volumes, and data!"
echo "The following volumes will be permanently deleted:"
echo "  - bheda_postgres_data"
echo "  - bheda_redis_data"
echo "  - bheda_mongo_data"
echo "  - bheda_minio_data"
echo ""

read -rp "Are you sure you want to continue? [y/N]: " CONFIRM
if [[ ! "$CONFIRM" =~ ^[Yy]$ ]]; then
  echo "Reset cancelled."
  exit 0
fi

echo ""
echo "[1/4] Tearing down existing containers and volumes..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" down -v --remove-orphans 2>/dev/null || true

echo "[2/4] Removing any leftover named volumes..."
docker volume rm \
  bheda_postgres_data \
  bheda_redis_data \
  bheda_mongo_data \
  bheda_minio_data \
  2>/dev/null || true

echo "[3/4] Pruning stale containers and networks..."
docker container prune -f 2>/dev/null || true
docker network prune -f 2>/dev/null || true

echo "[4/4] Rebuilding and starting all services..."
docker compose -f "$SCRIPT_DIR/docker-compose.yml" build --pull --no-cache 2>&1 | tail -5
docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d

echo ""
echo "=== Reset complete ==="
echo "Waiting for services to become healthy..."
echo ""

sleep 5

"$SCRIPT_DIR/scripts/health-check.sh" || true

echo ""
echo "Run 'docker compose logs -f' to follow service output."
