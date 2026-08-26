#!/bin/bash
# Publie une IPA en installation OTA sur le Tailnet.
#
# iOS n'installe une app ad hoc hors App Store que par `itms-services://`, et
# exige du HTTPS avec un certificat valide. Tailscale en fournit un pour le nom
# de la machine, ce qui évite d'exposer quoi que ce soit sur Internet : seuls
# les appareils du Tailnet joignent l'URL.
#
#   ./serve-ipa.sh /chemin/vers/app.ipa
set -euo pipefail

IPA="${1:?usage: serve-ipa.sh <chemin.ipa>}"
[ -f "$IPA" ] || { echo "introuvable : $IPA" >&2; exit 1; }

HOST="$(tailscale status --json | python3 -c 'import json,sys; print(json.load(sys.stdin)["Self"]["DNSName"].rstrip("."))')"
ROOT="$HOME/.ipa-serve"
BASE="https://${HOST}"

rm -rf "$ROOT"
mkdir -p "$ROOT"
cp "$IPA" "$ROOT/CoraiaDrive.ipa"

cat > "$ROOT/manifest.plist" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>items</key>
  <array>
    <dict>
      <key>assets</key>
      <array>
        <dict>
          <key>kind</key><string>software-package</string>
          <key>url</key><string>${BASE}/CoraiaDrive.ipa</string>
        </dict>
      </array>
      <key>metadata</key>
      <dict>
        <key>bundle-identifier</key><string>eu.coraia.drive</string>
        <key>bundle-version</key><string>1.0.0</string>
        <key>kind</key><string>software</string>
        <key>title</key><string>Coraia Drive</string>
      </dict>
    </dict>
  </array>
</dict>
</plist>
PLIST

cat > "$ROOT/index.html" <<HTML
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Installer Coraia Drive</title>
<style>
  body{font:17px/1.5 -apple-system,system-ui,sans-serif;background:#0b0b0f;color:#fff;
       display:grid;place-items:center;min-height:100vh;margin:0;padding:24px}
  a{display:block;background:#0a84ff;color:#fff;text-decoration:none;padding:16px 32px;
    border-radius:14px;font-weight:600}
  p{color:#8e8e93;font-size:14px;text-align:center;max-width:26em}
</style>
<div>
  <a href="itms-services://?action=download-manifest&amp;url=${BASE}/manifest.plist">Installer Coraia&nbsp;Drive</a>
  <p>Depuis l'iPhone, connecté au Tailnet. Si rien ne se passe, l'icône apparaît quand même sur l'écran d'accueil au bout de quelques secondes.</p>
</div>
HTML

tailscale serve --bg --https=443 "$ROOT" >/dev/null 2>&1 || tailscale serve --bg "$ROOT"

echo "IPA     : $(du -h "$ROOT/CoraiaDrive.ipa" | cut -f1)"
echo "Ouvrir sur l'iPhone : ${BASE}/"
