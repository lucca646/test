#!/usr/bin/env bash
# Build iOS simulateur sur Mac mini (sans signature).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/ios"

eval "$(/usr/local/bin/brew shellenv 2>/dev/null || true)"
export NVM_DIR="${NVM_DIR:-$HOME/.nvm}"
# shellcheck source=/dev/null
[[ -s "$NVM_DIR/nvm.sh" ]] && . "$NVM_DIR/nvm.sh"

SCHEME="${IOS_SCHEME:-CoraiaGlass}"
CONFIG="${IOS_CONFIG:-Debug}"

echo "[mac-mini-build] scheme=$SCHEME config=$CONFIG"

xcodebuild \
  -workspace CoraiaGlass.xcworkspace \
  -scheme "$SCHEME" \
  -configuration "$CONFIG" \
  -sdk iphonesimulator \
  -destination "generic/platform=iOS Simulator" \
  CODE_SIGNING_ALLOWED=NO \
  build

echo "[mac-mini-build] BUILD SUCCEEDED"
