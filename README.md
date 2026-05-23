# Bheda — Web Vulnerability Lab + CTF Platform

## Quick Start

### One-Click (all platforms)
```bash
curl -fsSL https://raw.githubusercontent.com/atirathi/bheda/master/setup.sh | bash
```

### Manual
```bash
cp .env.example .env
docker compose up -d
# → Frontend: http://localhost:3000
# → API:      http://localhost:8000
# → TLS Lab:  https://localhost:44301-44316
```

## Modes

| Mode | Command | Description |
|------|---------|-------------|
| Practice | `docker compose up -d` | Self-paced, hints available |
| CTF | `docker compose -f docker-compose.yml -f deploy/compose/docker-compose.ctf.yml up -d` | Team competition, scored |
| TLS Lab | `docker compose -f docker-compose.yml -f deploy/compose/docker-compose.tls.yml up -d` | With TLS challenges |
| Full | `docker compose -f docker-compose.yml -f deploy/compose/docker-compose.tls.yml -f deploy/compose/docker-compose.ctf.yml up -d` | Everything |

## Admin Access

```
URL:      http://localhost:3000/admin
Username:  admin
Password:  admin
```

## Architecture

See `ARCHITECTURE.md` for full details.

## Challenge Library

| Category | Count | Difficulty |
|----------|:-----:|------------|
| SQL Injection | 16 | B/I/A/E |
| Cross-Site Scripting | 15 | B/I/A/E |
| Broken Access Control | 20 | B/I/A/E |
| SSRF | 10 | B/I/A/E |
| Server-Side Template Injection | 6 | B/I/A/E |
| JWT / Token Manipulation | 10 | B/I/A/E |
| Authentication & Session Flaws | 14 | B/I/A/E |
| Deserialization | 9 | B/I/A/E |
| XXE | 7 | B/I/A/E |
| Race Conditions | 8 | B/I/A/E |
| API-Specific | 16 | B/I/A/E |
| Supply Chain & CI/CD | 8 | I/A/E |
| Cryptographic Failures | 8 | B/I/A/E |
| Logging & Error Handling | 6 | B/I/A/E |
| WebSocket | 6 | B/I/A/E |
| WASM / Sandbox Escape | 5 | A/E |
| Business Logic | 10 | B/I/A/E |
| Infrastructure & Cloud | 6 | A/E |
| WAF Bypass | 5 | I/A/E |
| Other Notable | 5 | B/I/A/E |
| SSL/TLS | 16 | B/I/A/E |
| Zero-Day | 8 | A/E |
| Boss Chains | 7 | E |
| Rabbit Holes | 51 | — |
| **Total** | **272** | — |

B = Beginner · I = Intermediate · A = Advanced · E = Expert
