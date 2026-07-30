#!/usr/bin/env bash
# Build store + upload App Store Connect (TestFlight).
set -euo pipefail
cd "$(dirname "$0")"
: "${EXPO_TOKEN:?Définis EXPO_TOKEN (expo.dev → Access tokens)}"
: "${EXPO_APPLE_ID:?Définis EXPO_APPLE_ID}"
: "${EXPO_APPLE_APP_SPECIFIC_PASSWORD:?Définis EXPO_APPLE_APP_SPECIFIC_PASSWORD}"

npx eas-cli whoami
npx eas-cli build \
  --platform ios \
  --profile production \
  --auto-submit \
  --non-interactive \
  "$@"
