#!/usr/bin/env bash
# Désactive la veille système sur Mac mini (SSH / local).
# Usage: MAC_MINI_SSH_PASSWORD='…' ./scripts/mac-mini-disable-sleep.sh
set -euo pipefail

SUDO_PASS="${MAC_MINI_SSH_PASSWORD:-1212}"

sudo_cmd() {
  printf '%s\n' "$SUDO_PASS" | sudo -S "$@"
}

log() { printf '[mac-mini-sleep] %s\n' "$*"; }

log "Désactivation veille (pmset + systemsetup)…"

sudo_cmd pmset -a \
  sleep 0 \
  disksleep 0 \
  autopoweroff 0 \
  standby 0 \
  powernap 0 \
  hibernatemode 0 \
  tcpkeepalive 1 \
  womp 1 \
  displaysleep 10

sudo_cmd systemsetup -setcomputersleep Never 2>/dev/null || true
sudo_cmd systemsetup -setharddisksleep Never 2>/dev/null || true
sudo_cmd systemsetup -setwakeonnetworkaccess on 2>/dev/null || true

log "Réglages actuels :"
pmset -g custom
systemsetup -getcomputersleep 2>/dev/null || true
systemsetup -getwakeonnetworkaccess 2>/dev/null || true

log "OK — le Mac ne devrait plus se mettre en veille (écran peut s'éteindre après 10 min)."
