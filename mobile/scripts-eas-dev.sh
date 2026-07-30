#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
: "${EXPO_TOKEN:?Définis EXPO_TOKEN (expo.dev → Access tokens)}"
npx eas-cli whoami
npx eas-cli build --platform ios --profile development --non-interactive "$@"
