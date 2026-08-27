#!/usr/bin/env bash
# Bootstrap build iOS local sur Mac mini (Tailscale mac-mini-de-lucca-2).
# Usage: MAC_MINI_SSH_PASSWORD=… ./scripts/mac-mini-setup-build.sh  (depuis le Mac)
# Ou exécuter les étapes manuellement via SSH.
set -euo pipefail

PROJECT_DIR="${MAC_MINI_PROJECT_DIR:-$HOME/Projects/liquid-glass-mobile}"
REPO_URL="${MAC_MINI_REPO_URL:-https://github.com/lucca646/test.git}"
NODE_VERSION="${MAC_MINI_NODE_VERSION:-20}"
SUDO_PASS="${MAC_MINI_SSH_PASSWORD:-}"

log() { printf '[mac-mini-setup] %s\n' "$*"; }

sudo_cmd() {
  if [[ -n "$SUDO_PASS" ]]; then
    printf '%s\n' "$SUDO_PASS" | sudo -S "$@"
  else
    sudo "$@"
  fi
}

ensure_xcode() {
  if [[ ! -d /Applications/Xcode.app ]]; then
    if [[ -d "$HOME/Downloads/Xcode.app" ]]; then
      log "Installation de Xcode depuis ~/Downloads/Xcode.app…"
      sudo_cmd mv "$HOME/Downloads/Xcode.app" /Applications/Xcode.app
    else
      log "ERREUR: Xcode.app introuvable dans /Applications ou ~/Downloads"
      exit 1
    fi
  fi
  sudo_cmd xcode-select -s /Applications/Xcode.app/Contents/Developer
  sudo_cmd xcodebuild -license accept 2>/dev/null || true
  sudo_cmd xcodebuild -runFirstLaunch 2>/dev/null || true
  xcodebuild -version
}

ensure_homebrew() {
  if ! command -v brew >/dev/null 2>&1; then
    log "Installation Homebrew…"
    if [[ -n "$SUDO_PASS" ]]; then
      printf '#!/bin/sh\necho "%s"\n' "$SUDO_PASS" > /tmp/askpass.sh
      chmod +x /tmp/askpass.sh
      export SUDO_ASKPASS=/tmp/askpass.sh
      sudo -A -v
    fi
    NONINTERACTIVE=1 /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  fi
  if [[ -x /usr/local/bin/brew ]]; then
    eval "$(/usr/local/bin/brew shellenv)"
  elif [[ -x /opt/homebrew/bin/brew ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  fi
  brew --version
}

ensure_node() {
  export NVM_DIR="$HOME/.nvm"
  if [[ ! -s "$NVM_DIR/nvm.sh" ]]; then
    log "Installation nvm…"
    curl -fsSL https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  fi
  # shellcheck source=/dev/null
  . "$NVM_DIR/nvm.sh"
  nvm install "$NODE_VERSION"
  nvm use "$NODE_VERSION"
  node -v
}

ensure_cocoapods() {
  if ! command -v pod >/dev/null 2>&1; then
    log "Installation CocoaPods (Homebrew)…"
    brew install cocoapods
  fi
  pod --version
}

ensure_repo() {
  mkdir -p "$(dirname "$PROJECT_DIR")"
  if [[ ! -d "$PROJECT_DIR/.git" ]]; then
    log "Clone $REPO_URL → $PROJECT_DIR"
    git clone "$REPO_URL" "$PROJECT_DIR"
  else
    log "Mise à jour repo $PROJECT_DIR"
    git -C "$PROJECT_DIR" pull --ff-only || true
  fi
}

ensure_mobile_deps() {
  # shellcheck source=/dev/null
  . "$HOME/.nvm/nvm.sh"
  cd "$PROJECT_DIR/mobile"
  npm ci
  CI=1 npx expo prebuild --platform ios --clean
  cd ios && pod install && cd ..
}

main() {
  ensure_xcode
  ensure_homebrew
  ensure_node
  ensure_cocoapods
  ensure_repo
  ensure_mobile_deps
  log "Prêt. Build simulateur: cd $PROJECT_DIR/mobile && ./scripts/mac-mini-build-ios.sh"
}

main "$@"
