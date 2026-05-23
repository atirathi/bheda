#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check_http() {
  local name="$1"
  local url="$2"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$url" 2>/dev/null || echo "000")
  if [ "$status" = "200" ] || [ "$status" = "301" ] || [ "$status" = "302" ]; then
    echo -e "  ${GREEN}✓${NC} $name ($status)"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $name (HTTP $status)"
    ((FAIL++))
  fi
}

check_ping() {
  local name="$1"
  local result
  result=$(redis-cli -a bheda_redis_2026 ping 2>/dev/null || echo "FAIL")
  if [ "$result" = "PONG" ]; then
    echo -e "  ${GREEN}✓${NC} $name"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $name ($result)"
    ((FAIL++))
  fi
}

check_pg() {
  local name="$1"
  if pg_isready -U bheda -d bheda -h localhost -p 5432 2>/dev/null >/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name"
    ((PASS++))
  else
    echo -e "  ${RED}✗${NC} $name"
    ((FAIL++))
  fi
}

check_tcp_port() {
  local name="$1"
  local host="$2"
  local port="$3"
  if timeout 3 bash -c "echo >/dev/tcp/$host/$port" 2>/dev/null; then
    echo -e "  ${GREEN}✓${NC} $name ($host:$port)"
    ((PASS++))
  else
    echo -e "  ${YELLOW}~${NC} $name ($host:$port — not responding)"
    ((WARN++))
  fi
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║          Bheda — Service Health Check           ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

echo -e "${CYAN}Platform Services:${NC}"
check_http "Backend API" "http://localhost:8000/api/v1/health"
check_http "Frontend" "http://localhost:3000"
check_http "Vulnerable App" "http://localhost:3001/health"
check_http "Rabbit Holes" "http://localhost:3002/health"
check_http "Zero Days" "http://localhost:3003/health"
check_http "CTF Engine" "http://localhost:3004/health"
check_http "WAF" "http://localhost:80/health"

echo ""
echo -e "${CYAN}Core Infrastructure:${NC}"
check_http "MinIO Console" "http://localhost:9001"
check_pg "PostgreSQL"
check_ping "Redis"

echo ""
echo -e "${CYAN}Honeypot Services:${NC}"
check_http "Payment" "http://localhost:3010/health"
check_http "User Sync" "http://localhost:3011/health"
check_http "Dashboard" "http://localhost:3012/health"
check_http "Legacy API" "http://localhost:3013/health"

echo ""
echo -e "${CYAN}TLS Lab (16 ports):${NC}"
for i in $(seq 1 16); do
  check_tcp_port "tls-$(printf '%02d' $i)" "localhost" "$((44300 + i))"
done

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo -e "║  Results:  ${GREEN}$PASS passing${NC},  ${RED}$FAIL failing${NC},  ${YELLOW}$WARN warnings${NC}  ║"
echo "╚══════════════════════════════════════════════════╝"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
