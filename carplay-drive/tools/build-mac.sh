#!/bin/bash
# Build iOS local + publication OTA sur le Tailnet.
#
# À lancer depuis le Terminal du Mac, PAS par SSH : `codesign` a besoin de la
# session graphique pour se servir de la clé privée du trousseau. Depuis SSH il
# sort en `errSecInternalComponent`, alors même que la clé est parfaitement
# accessible (une signature CMS passe sans problème) et que la partition list
# autorise `codesign:`. C'est une limite de macOS, pas de la configuration.
#
#   ~/carplay-dbg/carplay-drive/tools/build-mac.sh
set -euo pipefail

export PATH="/usr/local/bin:$HOME/.nvm/versions/node/v20.20.2/bin:$PATH"
cd "$(dirname "$0")/.."
PROJECT="$PWD"

echo "▸ mise à jour du dépôt"
git -C "$PROJECT/.." pull --ff-only

# patch-package échoue si le paquet est déjà patché par une installation
# précédente : on le réextrait pour repartir de la version publiée.
echo "▸ dépendances"
rm -rf node_modules/react-native-carplay
npm install

echo "▸ build (signature locale, cf. credentials.json)"
npx eas-cli build --platform ios --profile preview-local --local --non-interactive

IPA="$(ls -t "$PROJECT"/build-*.ipa "$PROJECT"/*.ipa 2>/dev/null | head -1 || true)"
[ -n "$IPA" ] || { echo "aucune IPA produite" >&2; exit 1; }

echo "▸ publication"
"$PROJECT/tools/serve-ipa.sh" "$IPA"
