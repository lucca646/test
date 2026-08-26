#!/usr/bin/env bash
# Sync Apple signing from EAS remote → Mac keychain + ios/certs + credentials.json
# Usage: cd mobile && ./scripts/mac-mini-sync-signing.sh
set -euo pipefail

cd "$(dirname "$0")/.."

ENV_FILE=".env.eas"
if [[ ! -f "$ENV_FILE" ]]; then
  echo "❌ Absent : mobile/.env.eas"
  exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

: "${EXPO_TOKEN:?Manque EXPO_TOKEN}"
export EXPO_TOKEN

PROJECT_ID="${EAS_PROJECT_ID:-cfec5576-6c42-4ead-b311-2e85c207cb33}"
CERTS_DIR="ios/certs"
KC="${HOME}/Library/Keychains/login.keychain-db"
LOGIN_PASS="${MAC_MINI_SSH_PASSWORD:-${KEYCHAIN_PASSWORD:-}}"

mkdir -p "$CERTS_DIR"
chmod 700 "$CERTS_DIR"

echo "[signing] Download credentials from EAS…"
curl -fsS -X POST https://api.expo.dev/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${EXPO_TOKEN}" \
  -H "User-Agent: eas-cli" \
  -d "{\"query\":\"{ app { byId(appId: \\\"${PROJECT_ID}\\\") { iosAppCredentials { iosAppBuildCredentialsList { iosDistributionType distributionCertificate { serialNumber certificateP12 certificatePassword } provisioningProfile { appleUUID expiration provisioningProfile appleAppIdentifier { bundleIdentifier } } } } } } }\"}" \
  -o /tmp/eas-creds.json

python3 - <<'PY'
import json, base64, pathlib, os
data = json.loads(pathlib.Path("/tmp/eas-creds.json").read_text())
if data.get("errors"):
    raise SystemExit(f"GraphQL errors: {data['errors']}")
certs = pathlib.Path("ios/certs")
certs.mkdir(exist_ok=True)
p12_done = False
n = 0
for ac in data["data"]["app"]["byId"]["iosAppCredentials"]:
    for bc in ac["iosAppBuildCredentialsList"]:
        dist = bc["iosDistributionType"]
        cert = bc["distributionCertificate"]
        prof = bc["provisioningProfile"]
        if cert and not p12_done:
            (certs / "dist.p12").write_bytes(base64.b64decode(cert["certificateP12"]))
            (certs / "dist.password").write_text(cert["certificatePassword"])
            (certs / "dist.p12").chmod(0o600)
            (certs / "dist.password").chmod(0o600)
            p12_done = True
            print(f"[signing] cert {cert['serialNumber']}")
        if prof:
            bundle = (prof.get("appleAppIdentifier") or {}).get("bundleIdentifier") or "unknown"
            name = f"{dist.lower()}-{bundle.replace('.', '_')}.mobileprovision"
            (certs / name).write_bytes(base64.b64decode(prof["provisioningProfile"]))
            (certs / name).chmod(0o600)
            n += 1
            print(f"[signing] profile {name}")
print(f"[signing] {n} profiles written")
PY

P12_PASS="$(cat "$CERTS_DIR/dist.password")"
MAIN_ADHOC="$(ls "$CERTS_DIR"/ad_hoc-eu_coraia_liquidglass_dev.mobileprovision 2>/dev/null | head -1)"
EXT_ADHOC="$(ls "$CERTS_DIR"/ad_hoc-eu_coraia_liquidglass_dev_LiveActivity.mobileprovision 2>/dev/null | head -1)"

cat > credentials.json <<EOF
{
  "ios": {
    "CoraiaGlass": {
      "provisioningProfilePath": "${MAIN_ADHOC}",
      "distributionCertificate": {
        "path": "ios/certs/dist.p12",
        "password": "${P12_PASS}"
      }
    },
    "LiveActivity": {
      "provisioningProfilePath": "${EXT_ADHOC}",
      "distributionCertificate": {
        "path": "ios/certs/dist.p12",
        "password": "${P12_PASS}"
      }
    }
  }
}
EOF
chmod 600 credentials.json
echo "[signing] credentials.json OK (CoraiaGlass + LiveActivity)"

if [[ -n "$LOGIN_PASS" ]]; then
  security unlock-keychain -p "$LOGIN_PASS" "$KC" || true
  security set-keychain-settings -t 21600 -l "$KC" || true
fi

# WWDR intermediates (idempotent)
for cer in AppleWWDRCAG3 AppleWWDRCAG2; do
  curl -fsSL -o "/tmp/${cer}.cer" "https://www.apple.com/certificateauthority/${cer}.cer" || true
  security import "/tmp/${cer}.cer" -k "$KC" 2>/dev/null || true
done

security import "$CERTS_DIR/dist.p12" -k "$KC" -P "$P12_PASS" \
  -T /usr/bin/codesign -T /usr/bin/security -T /usr/bin/productbuild -T /usr/bin/xcodebuild 2>/dev/null \
  || echo "[signing] p12 already in keychain (ok)"

if [[ -n "$LOGIN_PASS" ]]; then
  security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "$LOGIN_PASS" "$KC" >/dev/null 2>&1 || true
fi

mkdir -p "$HOME/Library/MobileDevice/Provisioning Profiles"
for f in "$CERTS_DIR"/*.mobileprovision; do
  uuid="$(security cms -D -i "$f" 2>/dev/null | plutil -extract UUID raw -o - - 2>/dev/null || true)"
  [[ -n "$uuid" ]] && cp "$f" "$HOME/Library/MobileDevice/Provisioning Profiles/${uuid}.mobileprovision"
done

echo "[signing] Valid identities:"
security find-identity -v -p codesigning
echo "[signing] Done. EAS Local device: ./scripts/mac-mini-eas-local.sh development"
