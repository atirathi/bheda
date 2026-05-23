# Quick Start

## Prerequisites
- Docker
- Git

## One-Click Setup (recommended)
```bash
curl -fsSL https://raw.githubusercontent.com/atirathi/bheda/master/setup.sh | bash
```

## Manual Setup
```bash
git clone https://github.com/atirathi/bheda
cd bheda
cp .env.example .env
# Generate TLS certs (required for TLS lab)
./scripts/gen-certs.sh
docker compose up -d
```

## Access
- **Frontend:** http://localhost:3000
- **API:** http://localhost:8000/docs
- **Admin:** http://localhost:3000/admin (admin / admin)
- **TLS Lab:** https://localhost:44301-44316

## First Steps
1. Open the frontend
2. Login with username `admin`, password `admin`
3. Browse the practice lab catalog
4. Try your first SQLi challenge: http://localhost:3001/api/v1/sqli/01?id=1
5. Submit flags when you solve challenges

## Full Setup Guide
See [SETUP.md](../SETUP.md) for Windows, Linux, and macOS step-by-step instructions.
