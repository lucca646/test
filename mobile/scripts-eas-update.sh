#!/usr/bin/env bash
# Publie un update OTA (JS) — ne consomme pas de crédit build EAS.
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE="$(dirname "$0")/.env.eas"
if [[ -f "$ENV_FILE" ]]; then
  # shellcheck disable=SC1090
  set -a
  source "$ENV_FILE"
  set +a
fi

: "${EXPO_TOKEN:?Manque EXPO_TOKEN — mets-le dans mobile/.env.eas}"

CHANNEL="${1:-preview}"
MESSAGE="${2:-OTA update}"

export EXPO_TOKEN
npx eas-cli whoami
CI=1 npx eas-cli update \
  --channel "$CHANNEL" \
  --message "$MESSAGE" \
  --platform ios \
  --non-interactive
