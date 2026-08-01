#!/usr/bin/env bash
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

export EXPO_TOKEN
npx eas-cli whoami
npx eas-cli build --platform ios --profile development --non-interactive "$@"
