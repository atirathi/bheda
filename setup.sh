#!/usr/bin/env bash
set -euo pipefail

# ╔══════════════════════════════════════════════════════════════╗
# ║  Bheda — One-Click Setup (Windows / Linux / macOS)         ║
# ║                                                             ║
# ║  Pin to a commit SHA, NOT master:                           ║
# ║    SHA=<commit-sha>                                         ║
# ║    curl -fsSL https://raw.githubusercontent.com/             ║
# ║      atirathi/bheda/${SHA}/setup.sh | bash                  ║
# ║  Or use a tagged release:                                   ║
# ║    curl -fsSL https://raw.githubusercontent.com/             ║
# ║      atirathi/bheda/v1.0.0/setup.sh | bash                  ║
# ║                                                             ║
# ║  Never pipe master to bash — anyone with push access to the ║
# ║  repo (or anyone who compromises a maintainer account) can  ║
# ║  inject code into the bootstrap itself.                     ║
# ╚══════════════════════════════════════════════════════════════╝

REPO_URL="https://github.com/atirathi/bheda.git"
INSTALL_DIR="${HOME}/bheda"
TARGET_SERVICES=27

GREEN='\033[0;32m'; YELLOW='\033[1;33m'; RED='\033[0;31m'; CYAN='\033[0;36m'; NC='\033[0m'
log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
fail() { echo -e "${RED}[✗]${NC} $1"; exit 1; }
info() { echo -e "${CYAN}[i]${NC} $1"; }

RAW_OS="$(uname -s)"
ARCH="$(uname -m)"

# ─── Platform Detection ─────────────────────────────────────────

IS_WSL=false
IS_GITBASH=false
IS_MAC=false
IS_LINUX=false

case "$RAW_OS" in
  Linux)
    if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
      IS_WSL=true
    fi
    IS_LINUX=true
    ;;
  Darwin)
    IS_MAC=true
    ;;
  MINGW*|MSYS*|CYGWIN*)
    IS_GITBASH=true
    ;;
esac

# ─── Cleanup handler ────────────────────────────────────────────

cleanup() {
  echo ""
  warn "Setup interrupted. Cleaning up..."
  if [ -d "$INSTALL_DIR" ] && [ -f "$INSTALL_DIR/docker-compose.yml" ]; then
    cd "$INSTALL_DIR" && docker compose down 2>/dev/null || true
  fi
  info "Partial state cleaned. Re-run the script to continue."
  exit 1
}
trap cleanup INT TERM
HAS_TTY=false; [ -t 0 ] && HAS_TTY=true

# ─── Package Manager ────────────────────────────────────────────

detect_pm() {
  if command -v apt &>/dev/null; then echo "apt"
  elif command -v dnf &>/dev/null; then echo "dnf"
  elif command -v yum &>/dev/null; then echo "yum"
  elif command -v pacman &>/dev/null; then echo "pacman"
  elif command -v brew &>/dev/null; then echo "brew"
  else echo "none"; fi
}

# ─── Docker Install — Linux ─────────────────────────────────────

install_docker_linux() {
  local pm; pm=$(detect_pm)
  case "$pm" in
    apt)
      sudo apt update && sudo apt install -y ca-certificates curl gnupg
      sudo install -m 0755 -d /etc/apt/keyrings
      curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
      . /etc/os-release
      echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu ${UBUNTU_CODENAME:-$VERSION_CODENAME} stable" \
        | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
      sudo apt update && sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
      ;;
    dnf|yum)
      sudo dnf -y install dnf-plugins-core
      sudo dnf config-manager --add-repo https://download.docker.com/linux/fedora/docker-ce.repo
      sudo dnf -y install docker-ce docker-ce-cli containerd.io docker-compose-plugin
      ;;
    pacman)
      sudo pacman -Syu --noconfirm docker docker-compose
      ;;
    *)
      fail "No supported package manager. Install Docker manually: https://docs.docker.com/engine/install/"
      ;;
  esac

  if command -v systemctl &>/dev/null; then
    sudo systemctl enable docker && sudo systemctl start docker
  else
    warn "systemctl not found — start Docker manually: sudo dockerd &"
  fi
  sudo usermod -aG docker "$USER" 2>/dev/null || true
  warn "Log out and back in for docker group to take effect (or run: newgrp docker)"
}

# ─── Docker Install — macOS ─────────────────────────────────────

install_docker_macos() {
  if ! command -v brew &>/dev/null; then
    info "Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    local brew_path
    if [ "$ARCH" = "arm64" ]; then
      brew_path="/opt/homebrew/bin/brew"
    else
      brew_path="/usr/local/bin/brew"
    fi
    echo 'eval "$('"$brew_path"' shellenv)"' >> "$HOME/.zprofile"
    echo 'eval "$('"$brew_path"' shellenv)"' >> "$HOME/.bash_profile"
    eval "$("$brew_path" shellenv)"
  fi

  if ! command -v docker &>/dev/null; then
    brew install --cask docker
    warn "Opening Docker Desktop installer. Complete the wizard, then come back here."
    if [ -n "${DISPLAY:-}" ] && [ -z "${CI:-}" ]; then
      open /Applications/Docker.app 2>/dev/null || true
    fi
    info "Waiting for Docker to start (up to 90s)..."
    for ((i=0; i<45; i++)); do
      if docker info &>/dev/null 2>&1; then log "Docker is running."; return 0; fi
      sleep 2
    done
    fail "Docker Desktop did not start. Open Docker.app manually and re-run."
  fi
}

# ─── Docker Install — Windows (Git Bash) ────────────────────────

install_docker_windows_gitbash() {
  warn "Docker Desktop is required."
  info "Download: https://www.docker.com/products/docker-desktop"
  info "Download: https://git-scm.com/download/win"
  cmd.exe /c start "" "https://www.docker.com/products/docker-desktop" 2>/dev/null || true
  if [ "$HAS_TTY" = true ]; then
    echo ""; read -rp "Press Enter after installing Docker Desktop and Git for Windows..."
  else
    warn "Run this script from Git Bash (not piped) after installing Docker Desktop."
    exit 0
  fi
  if ! command -v docker &>/dev/null; then
    fail "Docker not found. Ensure 'Docker Desktop' is running and in PATH, then re-run."
  fi
}

# ─── Docker Install — WSL ───────────────────────────────────────

install_docker_wsl() {
  info "WSL detected — installing Docker Engine inside WSL."
  install_docker_linux
  # WSL can also use Docker Desktop for Windows
  if command -v docker.exe &>/dev/null; then
    warn "Docker Desktop (Windows) is available. You can also use:"
    warn "  export DOCKER_HOST=tcp://localhost:2375"
    info "Falling back to native Docker Engine in WSL for now."
  fi
}

# ─── Docker — Main Installer ────────────────────────────────────

install_docker() {
  if docker info &>/dev/null 2>&1; then
    log "Docker is already installed and running."
    return 0
  fi

  if command -v docker &>/dev/null; then
    warn "Docker is installed but not running. Starting..."
    if [ "$IS_WSL" = true ]; then
      sudo dockerd &>/dev/null &
    elif [ "$IS_MAC" = true ]; then
      open /Applications/Docker.app 2>/dev/null || true
    fi
    for ((i=0; i<30; i++)); do
      if docker info &>/dev/null 2>&1; then log "Docker started."; return 0; fi
      sleep 3
    done
    fail "Docker is installed but won't start. Start it manually and re-run."
  fi

  info "Installing Docker..."
  if [ "$IS_GITBASH" = true ]; then
    install_docker_windows_gitbash
  elif [ "$IS_WSL" = true ]; then
    install_docker_wsl
  elif [ "$IS_MAC" = true ]; then
    install_docker_macos
  elif [ "$IS_LINUX" = true ]; then
    install_docker_linux
  else
    fail "Unsupported platform. Install Docker manually: https://docs.docker.com/engine/install/"
  fi

  if ! docker info &>/dev/null 2>&1; then
    fail "Docker did not start. Run setup.sh again after starting it."
  fi
  log "Docker ready."
}

# ─── Repo ───────────────────────────────────────────────────────

clone_repo() {
  if [ -d "$INSTALL_DIR" ]; then
    warn "Directory $INSTALL_DIR already exists. Pulling latest..."
    cd "$INSTALL_DIR" && git pull
  else
    log "Cloning repository..."
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
  fi
  cd "$INSTALL_DIR"
}

# ─── Environment ────────────────────────────────────────────────

setup_env() {
  if [ ! -f .env ]; then
    cp .env.example .env
    log ".env created from .env.example"
  else
    warn ".env already exists — skipping."
  fi
}

# ─── TLS Certs ──────────────────────────────────────────────────

generate_certs() {
  if [ -f tls-lab/certs/self-signed/server.crt ]; then
    log "TLS certificates already exist — skipping."
    return
  fi
  if ! command -v openssl &>/dev/null; then
    warn "OpenSSL not found — skipping TLS cert generation (TLS lab won't work)."
    return
  fi
  log "Generating TLS certificates..."
  chmod +x scripts/gen-certs.sh
  bash scripts/gen-certs.sh || warn "Cert generation had issues (non-fatal)."
}

# ─── Docker Compose ─────────────────────────────────────────────

start_services() {
  log "Building and starting ${TARGET_SERVICES} containers..."
  warn "First run: 5-15 min (downloading images + compiling)."
  warn "Subsequent runs: ~30 seconds."
  docker compose up -d --build
}

# ─── Health Check ───────────────────────────────────────────────

wait_for_health() {
  log "Waiting for services to become healthy..."
  local max=90
  local i=1
  while [ $i -le $max ]; do
    local healthy
    healthy=$(docker compose ps 2>/dev/null | grep -c healthy)
    printf "\r  Healthy: %d/%d  (attempt %d/%d)" "$healthy" "$TARGET_SERVICES" "$i" "$max"
    if [ "$healthy" -ge "$TARGET_SERVICES" ]; then
      echo ""; log "All $TARGET_SERVICES services are healthy!"
      return 0
    fi
    sleep 5
    i=$((i + 1))
  done
  echo ""
  warn "Not all services reached healthy. Check: cd ~/bheda && docker compose ps"
}

# ─── Summary ────────────────────────────────────────────────────

print_summary() {
  echo ""
  echo "╔═══════════════════════════════════════════════════════╗"
  echo "║            Bheda is ready!                            ║"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  Frontend:  http://localhost:3000                     ║"
  echo "║  API Docs:  http://localhost:8000/docs                ║"
  echo "║  Admin:     http://localhost:3000/admin               ║"
  echo "║  Username:  admin  |  Password: admin                 ║"
  echo "╠═══════════════════════════════════════════════════════╣"
  echo "║  Logs:  docker compose -f ~/bheda/docker-compose.yml logs -f  ║"
  echo "║  Reset: ./bheda/scripts/reset.sh                      ║"
  echo "╚═══════════════════════════════════════════════════════╝"
}

# ─── Main ───────────────────────────────────────────────────────

main() {
  cat << EOF

╔═══════════════════════════════════════════════════════╗
║    Bheda Vulnerability Lab — Automated Setup         ║
║    Platform: ${RAW_OS} ${ARCH}
╚═══════════════════════════════════════════════════════╝
EOF

  install_docker

  if ! command -v git &>/dev/null; then
    info "Installing Git..."
    if [ "$IS_MAC" = true ]; then
      brew install git
    elif [ "$IS_LINUX" = true ]; then
      local pm; pm=$(detect_pm)
      case "$pm" in
        apt) sudo apt install -y git ;;
        dnf|yum) sudo dnf install -y git ;;
        pacman) sudo pacman -Syu --noconfirm git ;;
        *) fail "Install Git manually and re-run." ;;
      esac
    elif [ "$IS_GITBASH" = true ]; then
      if ! command -v git &>/dev/null; then
        fail "Install Git for Windows from https://git-scm.com/download/win and re-run."
      fi
    fi
  fi
  clone_repo
  setup_env
  generate_certs
  start_services
  wait_for_health
  print_summary
}

main "$@"
