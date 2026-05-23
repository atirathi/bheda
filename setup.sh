#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════╗
# ║  Bheda — One-Click Setup                                   ║
# ║  Run: curl -fsSL https://raw.githubusercontent.com/          ║
# ║    atirathi/bheda/master/setup.sh | bash                    ║
# ╚══════════════════════════════════════════════════════════════╝

REPO_URL="https://github.com/atirathi/bheda.git"
INSTALL_DIR="${HOME}/bheda"

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }

OS="$(uname -s)"

detect_package_manager() {
  if command -v apt &>/dev/null; then echo "apt"
  elif command -v dnf &>/dev/null; then echo "dnf"
  elif command -v yum &>/dev/null; then echo "yum"
  elif command -v pacman &>/dev/null; then echo "pacman"
  elif command -v brew &>/dev/null; then echo "brew"
  else echo "unknown"; fi
}

install_docker_linux() {
  local pm
  pm=$(detect_package_manager)
  case "$pm" in
    apt)
      sudo apt update && sudo apt install -y ca-certificates curl gnupg
      sudo install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
      ;;
    dnf|yum)
      sudo dnf -y install dnf-plugins-core
      sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
      sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
      ;;
    pacman)
      sudo pacman -Sy --noconfirm docker docker-compose
      ;;
    *)
      fail "No supported package manager found. Install Docker manually: https://docs.docker.com/engine/install/"
      ;;
  esac
  sudo systemctl enable docker && sudo systemctl start docker
  sudo usermod -aG docker "$USER"
  warn "You may need to log out and back in for docker group to take effect."
}

install_docker_macos() {
  if ! command -v brew &>/dev/null; then
    warn "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  if ! command -v docker &>/dev/null; then
    brew install --cask docker
    warn "Open Docker.app from /Applications and wait for the engine to start."
    open /Applications/Docker.app
    echo "Waiting for Docker to start... (this may take a minute)"
    until docker info &>/dev/null; do sleep 2; done
  fi
}

install_docker_windows() {
  warn "Windows detected — please ensure Docker Desktop is installed."
  warn "Download from: https://www.docker.com/products/docker-desktop"
  warn "Also install Git Bash from: https://git-scm.com/download/win"
  warn ""
  warn "After installing both, run this script again from Git Bash."
  exit 0
}

install_docker() {
  if command -v docker &>/dev/null && docker info &>/dev/null; then
    log "Docker already installed and running."
    return
  fi
  log "Installing Docker..."
  case "$OS" in
    Linux)   install_docker_linux ;;
    Darwin)  install_docker_macos ;;
    *)       install_docker_windows ;;
  esac
  log "Docker installed successfully."
}

ensure_docker_running() {
  local max_attempts=30
  for i in $(seq 1 $max_attempts); do
    if docker info &>/dev/null; then return 0; fi
    sleep 2
  done
  fail "Docker did not start. Please start Docker manually and re-run."
}

clone_repo() {
  if [ -d "$INSTALL_DIR" ]; then
    warn "Directory $INSTALL_DIR already exists. Pulling latest..."
    cd "$INSTALL_DIR" && git pull
  else
    log "Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi
}

setup_env() {
  if [ ! -f .env ]; then
    log "Creating .env from .env.example..."
    cp .env.example .env
  else
    warn ".env already exists — skipping."
  fi
}

generate_certs() {
  if [ -f tls-lab/certs/self-signed/server.crt ]; then
    log "TLS certificates already exist — skipping."
    return
  fi
  log "Generating TLS certificates..."
  chmod +x scripts/gen-certs.sh
  ./scripts/gen-certs.sh || warn "Cert generation failed (non-fatal — TLS lab may not work)."
}

start_services() {
  log "Building and starting all services (27 containers)..."
  warn "This may take 5-15 minutes on first run (downloading images + building)."
  docker compose up -d --build
}

wait_for_health() {
  log "Waiting for services to become healthy..."
  local max=60
  for i in $(seq 1 $max); do
    local healthy
    healthy=$(docker compose ps --status healthy 2>/dev/null | wc -l)
    local total
    total=$(docker compose ps 2>/dev/null | wc -l)
    printf "\r  Healthy: %d/%d services" "$healthy" "$((total - 1))"
    if [ "$healthy" -ge "$((total - 2))" ]; then
      echo ""
      log "All services are up!"
      return 0
    fi
    sleep 5
  done
  echo ""
  warn "Some services may still be starting. Run 'docker compose ps' to check."
}

print_summary() {
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║          Bheda is ready!                             ║"
  echo "╠══════════════════════════════════════════════════════╣"
  echo "║  Frontend:  http://localhost:3000                    ║"
  echo "║  API Docs:  http://localhost:8000/docs               ║"
  echo "║  Admin:     http://localhost:3000/admin              ║"
  echo "║  Username:  admin                                    ║"
  echo "║  Password:  admin                                    ║"
  echo "╠══════════════════════════════════════════════════════╣"
  echo "║  Directory: $INSTALL_DIR              ║"
  echo "║  Reset:     cd bheda && ./scripts/reset.sh          ║"
  echo "║  Logs:      cd bheda && docker compose logs -f      ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""
}

main() {
  echo ""
  echo "╔══════════════════════════════════════════════════════╗"
  echo "║     Bheda — Automated Setup                         ║"
  echo "╚══════════════════════════════════════════════════════╝"
  echo ""

  install_docker
  ensure_docker_running
  clone_repo
  setup_env
  generate_certs
  start_services
  wait_for_health
  print_summary
}

main "$@"
