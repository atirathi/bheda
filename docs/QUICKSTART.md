# Quick Start

## Prerequisites
- Docker Desktop 4.25+
- Git

## Clone & Run
```bash
git clone https://github.com/atirathi/bheda
cd bheda
cp .env.example .env
docker compose up -d
```

## Access
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000/docs
- **Admin:** http://localhost:3000/admin (admin@bheda.lab / admin)
- **TLS Lab:** tls.lab:44301-44316

## First Steps
1. Open the frontend
2. Browse the practice lab catalog
3. Try your first SQLi challenge: http://localhost:3001/api/v1/sqli/01?id=1
4. Submit flags when you solve challenges
