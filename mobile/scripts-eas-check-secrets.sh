#!/usr/bin/env bash
# Source mobile/.env.eas et vérifie que les secrets TestFlight sont présents.
set -euo pipefail
cd "$(dirname "$0")"

ENV_FILE=".env.eas"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Absent : mobile/.env.eas"
  echo "   cp .env.eas.example .env.eas  puis remplis EXPO_TOKEN"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

ok=1
[[ -n "${EXPO_TOKEN:-}" ]] || { echo "❌ EXPO_TOKEN vide"; ok=0; }

if [[ "$ok" -eq 1 ]]; then
  export EXPO_TOKEN
  echo "✅ EXPO_TOKEN OK — Apple ID=${EXPO_APPLE_ID:-?} Team=${EXPO_APPLE_TEAM_ID:-?} ASC=${EXPO_ASC_APP_ID:-?}"
  echo "   (submit via API Key EAS — pas besoin de MDP d’app)"
  npx eas-cli whoami
else
  echo ""
  echo "Remplis mobile/.env.eas puis relance : ./scripts-eas-check-secrets.sh"
  exit 1
fi
