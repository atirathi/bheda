#!/bin/bash
# Runs once in the postgres container's docker-entrypoint-initdb.d.
# Creates a SEPARATE database for the intentionally-vulnerable app so its
# SQL-injection challenges can never read or tamper with the platform's
# real users, teams, submissions, or leaderboard (which live in the main
# POSTGRES_DB). The vuln-app creates its own tables there at startup.
set -e

VULN_DB="${VULN_DB:-bheda_vuln}"

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE ${VULN_DB}'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${VULN_DB}')\gexec
EOSQL

echo "=== vuln-app database '${VULN_DB}' ready ==="
