# Bheda — Web Vulnerability Lab + CTF Platform

> **Master Architecture Document**  
> *272 engagement objects · 22 categories · 5 difficulty tiers · 2 operational modes*

---

## 1. Project Overview

**Product:** A PortSwigger-class web vulnerability lab with built-in CTF engine. Progressive difficulty from beginner to expert. Real-world TLS, cloud, and supply-chain attack scenarios. Dual mode: self-paced practice and team-based competition.

**Repository:** `github.com/atirathi/bheda`  
**Tech Stack:** Next.js 14 · FastAPI · Express.js · ModSecurity · PostgreSQL · MongoDB · Redis · MinIO · nginx/OpenSSL · Wasmtime · Docker Compose / kind / k3s

---

## 2. Directory Structure

```
bheda/
├── README.md
├── ARCHITECTURE.md                  ← This file
├── docker-compose.yml               ← Main orchestrator
├── Dockerfile.backend
├── Dockerfile.frontend
├── Dockerfile.vuln-app
├── .env.example
│
├── backend/                         ← FastAPI Platform Backend
│   └── src/
│       ├── main.py                  ← App entry + middleware
│       ├── config.py                ← Environment + settings
│       ├── database.py              ← SQLAlchemy + Redis
│       ├── models/                  ← SQLAlchemy models
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── team.py
│       │   ├── challenge.py
│       │   ├── category.py
│       │   ├── event.py
│       │   ├── submission.py
│       │   └── profile.py
│       ├── routers/                 ← API endpoints
│       │   ├── __init__.py
│       │   ├── auth.py              ← Login, register, OAuth2, MFA
│       │   ├── users.py             ← User CRUD, admin
│       │   ├── teams.py             ← Team management
│       │   ├── challenges.py        ← Challenge catalog + state
│       │   ├── categories.py        ← Category CRUD + toggle
│       │   ├── events.py            ← CTF event lifecycle
│       │   ├── submissions.py       ← Flag submission + validation
│       │   ├── leaderboard.py       ← Live scoring
│       │   ├── profiles.py          ← Profile save/load
│       │   ├── schedule.py          ← Time-based automation
│       │   ├── rabbit_holes.py      ← Rabbit hole management
│       │   ├── monitor.py           ← Telemetry + logs
│       │   └── admin.py             ← Admin dashboard aggregate
│       ├── services/                ← Business logic
│       │   ├── __init__.py
│       │   ├── auth_service.py
│       │   ├── challenge_service.py
│       │   ├── ctf_service.py
│       │   ├── scoring_service.py
│       │   ├── profile_service.py
│       │   ├── schedule_service.py
│       │   ├── rabbit_hole_service.py
│       │   └── orchestration_service.py
│       ├── middleware/
│       │   ├── __init__.py
│       │   ├── auth_middleware.py
│       │   ├── challenge_middleware.py  ← Dynamic enable/disable
│       │   ├── rate_limit_middleware.py
│       │   └── waf_middleware.py
│       ├── schemas/                 ← Pydantic models
│       │   ├── __init__.py
│       │   ├── user.py
│       │   ├── challenge.py
│       │   ├── event.py
│       │   └── submission.py
│       └── tasks/                   ← Background workers
│           ├── __init__.py
│           ├── scheduler.py         ← APScheduler
│           └── cleanup.py           ← Stale instance cleanup
│
├── frontend/                        ← Next.js 14 App
│   └── src/
│       ├── app/
│       │   ├── layout.tsx
│       │   ├── page.tsx             ← Landing / dashboard
│       │   ├── practice/            ← Practice mode pages
│       │   │   ├── page.tsx         ← Lab catalog
│       │   │   └── [id]/page.tsx    ← Lab player
│       │   ├── ctf/                 ← CTF mode pages
│       │   │   ├── page.tsx         ← CTF dashboard
│       │   │   ├── leaderboard/page.tsx
│       │   │   ├── team/page.tsx
│       │   │   └── challenges/page.tsx
│       │   ├── admin/               ← Admin pages
│       │   │   ├── page.tsx
│       │   │   ├── users/page.tsx
│       │   │   ├── challenges/page.tsx
│       │   │   ├── categories/page.tsx
│       │   │   ├── events/page.tsx
│       │   │   ├── profiles/page.tsx
│       │   │   ├── schedule/page.tsx
│       │   │   ├── rabbit-holes/page.tsx
│       │   │   └── monitor/page.tsx
│       │   ├── challenges/          ← Public challenge browse
│       │   │   └── [category]/page.tsx
│       │   ├── auth/
│       │   │   ├── login/page.tsx
│       │   │   ├── register/page.tsx
│       │   │   └── mfa/page.tsx
│       │   └── api/                 ← Next.js API routes (proxy)
│       ├── components/
│       │   ├── ui/                  ← shadcn/ui primitives
│       │   ├── challenges/          ← Challenge cards, player, hints
│       │   ├── ctf/                 ← Scoreboard, team cards
│       │   ├── admin/               ← Admin tables, toggles, forms
│       │   └── layout/              ← Navbar, sidebar, footer
│       ├── lib/                     ← API client, utils
│       └── store/                   ← Zustand state
│
├── vuln-app/                        ← Vulnerable Application Core
│   └── src/
│       ├── app.ts                   ← Express entry
│       ├── routes/
│       │   ├── sqli/                ← 16 SQLi challenges
│       │   │   ├── index.ts
│       │   │   ├── sqli-01.ts
│       │   │   └── ...
│       │   ├── xss/                 ← 15 XSS challenges
│       │   ├── ssrf/                ← 10 SSRF challenges
│       │   ├── jwt/                 ← 10 JWT challenges
│       │   ├── ssti/                ← 6 SSTI challenges
│       │   ├── xxe/                 ← 7 XXE challenges
│       │   ├── deser/               ← 9 Deserialization challenges
│       │   ├── race/                ← 8 Race condition challenges
│       │   ├── oauth/               ← 5 OAuth challenges
│       │   ├── gql/                 ← 6 GraphQL challenges
│       │   ├── ws/                  ← 6 WebSocket challenges
│       │   ├── wasm/                ← 5 WASM challenges
│       │   ├── crypto/              ← 8 Crypto challenges
│       │   ├── biz/                 ← 10 Business logic challenges
│       │   ├── infra/               ← 6 Infrastructure challenges
│       │   └── waf/                 ← 5 WAF bypass challenges
│       ├── middleware/
│       │   ├── state_checker.ts     ← Checks challenge enabled/disabled
│       │   ├── waf_proxy.ts
│       │   └── error_handler.ts
│       ├── services/
│       │   ├── db.ts
│       │   ├── redis.ts
│       │   └── internal_api.ts
│       └── utils/
│           ├── flag.ts
│           └── helpers.ts
│
├── tls-lab/                         ← TLS Lab (16 containers)
│   ├── docker-compose.yml           ← Per-challenge nginx configs
│   ├── configs/
│   │   ├── 01-self-signed.conf
│   │   ├── 02-expired.conf
│   │   ├── 03-wildcard.conf
│   │   ├── 04-cn-san-bypass.conf
│   │   ├── 05-crl-disabled.conf
│   │   ├── 06-rsa512.conf
│   │   ├── 07-sslv3.conf
│   │   ├── 08-rc4.conf
│   │   ├── 09-null-cipher.conf
│   │   ├── 10-tls1.0-beast.conf
│   │   ├── 11-export-dh.conf
│   │   ├── 12-compression.conf
│   │   ├── 13-heartbleed.conf
│   │   ├── 14-renegotiation.conf
│   │   ├── 15-session-ticket.conf
│   │   └── 16-breach.conf
│   ├── certs/
│   │   ├── ca/
│   │   ├── self-signed/
│   │   ├── expired/
│   │   ├── wildcard/
│   │   ├── rsa512/
│   │   └── scripts/                ← Cert generation scripts
│   └── challenges/
│       ├── 01-self-signed.md
│       └── ...
│
├── challenges/                      ← Challenge Definitions (YAML)
│   ├── web/
│   │   ├── sqli/
│   │   │   ├── sqli-01.yaml
│   │   │   ├── sqli-02.yaml
│   │   │   └── ...
│   │   ├── xss/
│   │   ├── access-control/
│   │   ├── ssrf/
│   │   └── ...
│   ├── tls/
│   │   ├── tls-01.yaml
│   │   └── ...
│   ├── boss/
│   │   ├── boss-ragnarok.yaml
│   │   └── ...
│   ├── zero-day/
│   │   ├── zd-001.yaml
│   │   └── ...
│   └── rabbit-holes/
│       ├── rh-001.yaml
│       └── ...
│
├── rabbit-holes/                    ← Rabbit Hole Service
│   └── src/
│       ├── app.ts
│       ├── routes/
│       │   ├── decoy.ts            ← 20 decoy endpoints
│       │   ├── dead-end.ts         ← 8 dead-end chains
│       │   ├── honeypot.ts         ← 4 honeypot services
│       │   ├── circular.ts         ← 3 circular resources
│       │   └── deceptive.ts        ← 16 deceptive response manip
│       └── utils/
│
├── zero-days/                       ← Zero-Day Service
│   └── src/
│       ├── app.ts
│       ├── zd-001.ts               ← Sandman's Lullaby
│       ├── zd-002.ts               ← Ghost in the Protocol
│       ├── zd-003.ts               ← Silent Mutation
│       ├── zd-004.ts               ← Traitor's Fork
│       ├── zd-005.ts               ← Three Weaknesses
│       ├── zd-006.ts               ← Mirror's Edge
│       ├── zd-007.ts               ← Feature Not Bug
│       └── zd-008.ts               ← Warm Hole
│
├── ctf-engine/                      ← CTF Orchestration
│   └── src/
│       ├── orchestrator.ts         ← Spawn/teardown instances
│       ├── scoring.ts              ← Scoring engine
│       ├── leaderboard.ts          ← WebSocket leaderboard
│       └── anti-cheat.ts           ← Duplicate detection
│
├── waf/                            ← ModSecurity WAF
│   ├── Dockerfile
│   ├── modsecurity.conf
│   ├── crs/                        ← OWASP CRS 4.x
│   └── bypass-rules/               ← 5 intentional bypasses
│       ├── 01-linefeed-bypass.conf
│       ├── 02-unicode-bypass.conf
│       ├── 03-h2-downgrade.conf
│       ├── 04-chunked-bypass.conf
│       └── 05-multipart-bypass.conf
│
├── config/
│   ├── backend.env
│   ├── frontend.env
│   ├── vuln-app.env
│   ├── nginx.conf
│   └── traefik.yml
│
├── deploy/
│   ├── compose/
│   │   ├── docker-compose.yml      ← Main compose file
│   │   ├── docker-compose.tls.yml  ← TLS lab override
│   │   └── docker-compose.ctf.yml  ← CTF mode override
│   ├── k8s/
│   │   ├── backend-deployment.yml
│   │   ├── frontend-deployment.yml
│   │   ├── vuln-app-deployment.yml
│   │   └── ...
│   └── terraform/
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
├── scripts/
│   ├── init-db.sh                  ← DB schema + seed
│   ├── sync-challenges.sh          ← YAML → DB sync
│   ├── gen-certs.sh               ← TLS cert generation
│   ├── reset.sh                    ← Full reset
│   └── health-check.sh
│
└── data/                           ← Docker volumes (gitignored)
    ├── postgres/
    ├── redis/
    ├── mongo/
    └── minio/
```
