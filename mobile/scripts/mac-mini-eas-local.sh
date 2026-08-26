#!/usr/bin/env bash
# EAS Build local sur Mac mini (Xcode local, orchestration EAS).
# Usage: cd mobile && ./scripts/mac-mini-eas-local.sh [profile]
# Default profile: development-simulator
set -euo pipefail

cd "$(dirname "$0")/.."
PROFILE="${1:-development-simulator}"
PLATFORM="${EAS_PLATFORM:-ios}"

ENV_FILE=".env.eas"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Absent : mobile/.env.eas — cp .env.eas.example .env.eas puis EXPO_TOKEN"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${EXPO_TOKEN:?Manque EXPO_TOKEN dans .env.eas}"
export EXPO_TOKEN

eval "$(/usr/local/bin/brew shellenv 2>/dev/null || true)"
export PATH="/usr/local/bin:${PATH:-}"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck source=/dev/null
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"

if ! command -v fastlane >/dev/null 2>&1; then
  echo "❌ fastlane manquant — brew install fastlane"
  exit 1
fi

echo "[eas-local] whoami:"
npx eas-cli whoami
echo "[eas-local] fastlane=$(fastlane --version 2>/dev/null | head -1)"
echo "[eas-local] profile=$PROFILE platform=$PLATFORM"

CI=1 npx eas-cli build \
  --local \
  --platform "$PLATFORM" \
  --profile "$PROFILE" \
  --non-interactive

# Note: pass extra eas flags after profile via: PROFILE=development ./scripts/... -- --clear-cache
