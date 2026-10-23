#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

(($# >= 2)) || fail "Usage: run.sh TARGET web|go|go-tunnel|dev-client|android|ios [extra args]"
target="$1"
mode="$2"
shift 2
require_app "$target"
require_bun
[[ -d "$APP_ROOT/node_modules" ]] || fail "Dependencies are missing. Run setup first."
cd "$APP_ROOT"

case "$mode" in
  web) exec bunx expo start --web "$@" ;;
  go) exec bunx expo start --go "$@" ;;
  go-tunnel) exec bunx expo start --go --tunnel "$@" ;;
  dev-client) exec bunx expo start --dev-client "$@" ;;
  android) exec bunx expo run:android "$@" ;;
  ios) exec bunx expo run:ios "$@" ;;
  *) fail "Unknown runtime '$mode'. Use web, go, go-tunnel, dev-client, android, or ios." ;;
esac
