#!/bin/bash
set -euo pipefail

# ─── Bheda TLS Lab Certificate Generator ───
# Generates all certificates needed for the 16 TLS lab challenges.
# Output is placed under tls-lab/certs/.
#
# Reference from the TLS lab documentation:
#   https://github.com/atirathi/bheda/tree/main/tls-lab
#
# This script is a convenience wrapper. The authoritative cert generation
# logic lives in ./tls-lab/certs/scripts/. Run that directory's own
# generation script for the definitive cert set.

SCRIPT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
CERTS_DIR="${SCRIPT_DIR}/tls-lab/certs"
CERTS_SCRIPT="${CERTS_DIR}/scripts/generate-all.sh"

if [ -x "$CERTS_SCRIPT" ]; then
  echo "=== Running TLS certificate generation script ==="
  echo "Script: ${CERTS_SCRIPT}"
  echo "Output: ${CERTS_DIR}"
  echo ""
  exec "$CERTS_SCRIPT"
else
  echo "WARNING: Certificate generation script not found at:"
  echo "  ${CERTS_SCRIPT}"
  echo ""
  echo "Expected directory layout:"
  echo "  tls-lab/certs/"
  echo "    ca/              # Certificate Authority"
  echo "    self-signed/     # Self-signed certs (tls-01)"
  echo "    expired/         # Expired certs (tls-02)"
  echo "    wildcard/        # Wildcard certs (tls-03)"
  echo "    revoked/         # Revoked certs (tls-05)"
  echo "    rsa512/          # Weak RSA-512 certs (tls-06)"
  echo "    session/         # Session ticket keys (tls-15)"
  echo "    scripts/         # Generation scripts"
  echo ""
  echo "See ARCHITECTURE.md for details."
  exit 1
fi
