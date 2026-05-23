# Bheda — Setup Guide

Step-by-step instructions for **Windows**, **Linux**, and **macOS**.

---

## Prerequisites

| Tool | Windows | Linux | macOS |
|------|---------|-------|-------|
| **Docker Desktop** | ✓ | — | ✓ |
| **Docker Engine** | — | ✓ | — |
| **Docker Compose** | (bundled with Docker Desktop) | `docker compose` plugin | (bundled with Docker Desktop) |
| **Git** | `winget install Git.Git` | `apt install git` | `brew install git` |
| **curl / wget** | (bundled with Git Bash) | usually pre-installed | usually pre-installed |

---

## 1. Install Docker

### Windows
1. Download **Docker Desktop** from [docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Run the installer — ensure **WSL 2 backend** is selected
3. Restart when prompted
4. Open Docker Desktop and accept the license
5. Wait for the "Engine running" status (bottom-left green)

> **WSL 2 alternative** (lighter): Install Docker Engine inside WSL 2 Ubuntu
> and follow the Linux instructions below.

### Linux (Ubuntu / Debian)
```bash
# Remove old packages
sudo apt remove docker docker-engine docker.io containerd runc

# Install prerequisites
sudo apt update && sudo apt install -y ca-certificates curl gnupg

# Add Docker's official GPG key
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Set up repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine + Compose plugin
sudo apt update && sudo apt install -y \
  docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start Docker and enable on boot
sudo systemctl enable docker && sudo systemctl start docker

# Add your user to the docker group (avoids sudo)
sudo usermod -aG docker $USER && newgrp docker
```

### macOS
```bash
# Option A: Docker Desktop (recommended)
brew install --cask docker

# Option B: OrbStack (lighter alternative)
brew install --cask orbstack
```

Open the application once installed and wait for the Docker daemon to start.

---

## 2. Clone the Repository

```bash
git clone https://github.com/atirathi/bheda.git
cd bheda
```

---

## 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` if needed (defaults work for local setup).

---

## 4. Generate TLS Certificates (for TLS Lab)

```bash
# Linux / macOS
chmod +x scripts/gen-certs.sh
./scripts/gen-certs.sh
```

### Windows (Git Bash / WSL)
```bash
# Using Git Bash or WSL terminal
chmod +x scripts/gen-certs.sh
./scripts/gen-certs.sh
```

### Windows (PowerShell)
Open PowerShell as Administrator and run:
```powershell
# Ensure OpenSSL is installed
winget install OpenSSL.OpenSSL

# Run the cert generation script via Git Bash
& "C:\Program Files\Git\bin\bash.exe" -c "./scripts/gen-certs.sh"
```

> **Skip this step** if you don't need the TLS lab challenges
> (challenges 01-16 will still seed but the TLS servers won't start).

---

## 5. Start All Services

### Linux / macOS / Windows (WSL / Git Bash)
```bash
docker compose up -d
```

### Windows (PowerShell)
```powershell
docker compose up -d
```

This starts **27 containers**: PostgreSQL, Redis, MongoDB, MinIO, Backend,
Frontend, Vuln-App, WAF, Rabbit Holes, Zero-Days, CTF Engine,
4 Honeypots, and 16 TLS lab nginx containers.

---

## 6. Verify All Services

```bash
# Check all containers are up
docker compose ps

# Wait for health checks (30-60 seconds)
watch docker compose ps
```

All services should show `healthy` or `running`.

---

## 7. Access the Platform

| Service | URL |
|---------|-----|
| **Frontend (UI)** | `http://localhost:3000` |
| **API (Backend)** | `http://localhost:8000/docs` (Swagger UI) |
| **Admin Panel** | `http://localhost:3000/admin` |
| **TLS Lab** | `https://localhost:44301` through `https://localhost:44316` |
| **WAF** | `http://localhost:80` |
| **MinIO Console** | `http://localhost:9001` (user: `bheda`, pass: `bheda_minio_2026`) |

### Default Admin Credentials
```
Username: admin
Password: admin
```
> Login at `http://localhost:3000/auth/login`

---

## 8. Run in CTF Mode

```bash
docker compose -f docker-compose.yml -f deploy/compose/docker-compose.ctf.yml up -d
```

---

## 9. Reset Everything

```bash
# Full reset — destroys all data and rebuilds
./scripts/reset.sh
```

Or manually:
```bash
docker compose down -v
docker compose up -d
```

---

## Platform-Specific Notes

### Windows (PowerShell)
- Run PowerShell **as Administrator** for first-time Docker operations
- In `.env`, use `localhost` not `bheda.local` for `NEXT_PUBLIC_API_URL`
- Use `docker compose` (not `docker-compose`) — the hyphenated version is legacy

### Windows (WSL 2)
```bash
# From within your WSL 2 Ubuntu terminal
git clone https://github.com/atirathi/bheda.git
cd bheda
cp .env.example .env
docker compose up -d
```
- Access the frontend at `http://localhost:3000` from Windows browser
- Files edited from Windows (`/mnt/c/...`) may have permission issues —
  store the repo inside the WSL filesystem (`~/bheda`)

### macOS (Apple Silicon M1/M2/M3)
- Docker Desktop for Mac with **Rosetta** or **VZ** emulation works
- Some images (`nginx:1.24-alpine-slim` for tls-07) use `slim` variant —
  if it fails to pull, edit `docker-compose.yml` line 342:
  `image: nginx:1.24-alpine-slim` → `image: nginx:1.24-alpine`

### Linux
- If you get a `permission denied` error for Docker socket:
  ```bash
  sudo usermod -aG docker $USER
  # Log out and back in
  ```
- On **Ubuntu 24.04** (Noble): ensure `docker compose` v2 plugin is installed
  (`sudo apt install docker-compose-plugin`)
- Firewall: ensure ports `3000`, `8000`, `5432`, `6379`, `27017` are open on
  the Docker bridge (`docker0`)

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `port is already allocated` | Stop other services using the port, or change the host port in `docker-compose.yml` |
| `Container exited with code 0` | Run `docker compose logs <service>` to see errors |
| `backend` unhealthy | Ensure PostgreSQL is healthy first; run `docker compose logs backend` |
| `frontend` unhealthy | Backend must be healthy first; run `docker compose logs frontend` |
| `WAF version` warning in logs | Non-blocking — nginx 1.24 compatibility note |
| `TLS lab: ssl_crl none` error | Certs were not generated — run `./scripts/gen-certs.sh` |
| No challenges shown in UI | Backend seeds YAMLs on startup — wait 30s and refresh |
| Docker build fails on M1 Mac | Some base images may need `--platform linux/amd64` |
| Git push fails (`Invalid username or token`) | `unset GITHUB_TOKEN` before running `git push` |

---

## Architecture

See [`ARCHITECTURE.md`](ARCHITECTURE.md) for full details on the service
layout, directory structure, and challenge library.

## Security

See [`docs/SECURITY.md`](docs/SECURITY.md) for the Hall of Fame and
responsible disclosure process.
