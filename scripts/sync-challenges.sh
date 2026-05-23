#!/bin/bash
set -euo pipefail

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
API_KEY="${API_KEY:-bheda-internal-api-key-2026}"
CHALLENGES_DIR="${CHALLENGES_DIR:-$(dirname "$0")/../challenges}"

echo "=== Bheda Challenge Sync ==="
echo "Backend: $BACKEND_URL"
echo "Challenges directory: $CHALLENGES_DIR"
echo ""

if [ ! -d "$CHALLENGES_DIR" ]; then
  echo "ERROR: Challenges directory not found: $CHALLENGES_DIR"
  exit 1
fi

SYNC_ENDPOINT="${BACKEND_URL}/api/internal/sync"
TOTAL=0
declare -A CAT_COUNTS

sync_challenge() {
  local file="$1"
  local cat_name
  cat_name=$(basename "$(dirname "$(dirname "$file")")")
  local chal_name
  chal_name=$(basename "$file" .yaml)

  echo "  Syncing: $cat_name / $chal_name"

  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
    -X POST "$SYNC_ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "X-API-Key: $API_KEY" \
    -d @"$file" 2>/dev/null)

  if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "201" ]; then
    ((TOTAL++))
    CAT_COUNTS["$cat_name"]=$((CAT_COUNTS["$cat_name"] + 1))
  else
    echo "  WARNING: Failed to sync $chal_name (HTTP $HTTP_STATUS)"
  fi
}

echo "Scanning for challenge YAML files..."
while IFS= read -r file; do
  sync_challenge "$file"
done < <(find "$CHALLENGES_DIR" -name "*.yaml" -type f | sort)

echo ""
echo "=== Sync Summary ==="
echo "Total challenges synced: $TOTAL"
echo ""
echo "Per-category breakdown:"
for cat in "${!CAT_COUNTS[@]}"; do
  printf "  %-20s %d\n" "$cat" "${CAT_COUNTS[$cat]}"
done | sort -k2 -rn

echo ""
echo "=== Sync complete ==="
