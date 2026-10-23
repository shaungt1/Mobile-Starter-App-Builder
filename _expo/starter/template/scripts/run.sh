#!/usr/bin/env bash
# One entry point for every runtime surface.
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
mode="${1:-}"
if (($#)); then shift; fi
case "$mode" in
  web) exec bash "$SCRIPT_DIR/start-web.sh" "$@" ;;
  go) exec bash "$SCRIPT_DIR/metro.sh" go lan "$@" ;;
  go-tunnel) exec bash "$SCRIPT_DIR/metro.sh" go tunnel "$@" ;;
  dev-client) exec bash "$SCRIPT_DIR/metro.sh" dev-client lan "$@" ;;
  android | emulator) exec bash "$SCRIPT_DIR/start-emulator.sh" "$@" ;;
  usb) exec bash "$SCRIPT_DIR/start-usb.sh" "$@" ;;
  ios) exec bash "$SCRIPT_DIR/start-ios-simulator.sh" "$@" ;;
  *)
    echo 'Usage: bash scripts/run.sh web|go|go-tunnel|dev-client|android|usb|ios' >&2
    exit 2
    ;;
esac
