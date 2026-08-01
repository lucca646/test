#!/usr/bin/env bash
# Build store + upload App Store Connect (TestFlight), non-interactif.
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="$(dirname "$0")/.env.eas"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${EXPO_TOKEN:?Manque EXPO_TOKEN — mets-le dans mobile/.env.eas (voir .env.eas.example)}"

export EXPO_TOKEN
[[ -n "${EXPO_APPLE_ID:-}" ]] && export EXPO_APPLE_ID
[[ -n "${EXPO_APPLE_TEAM_ID:-}" ]] && export EXPO_APPLE_TEAM_ID
[[ -n "${EXPO_APPLE_APP_SPECIFIC_PASSWORD:-}" ]] && export EXPO_APPLE_APP_SPECIFIC_PASSWORD

npx eas-cli whoami
npx eas-cli build \
  --platform ios \
  --profile production \
  --auto-submit \
  --non-interactive \
  "$@"
