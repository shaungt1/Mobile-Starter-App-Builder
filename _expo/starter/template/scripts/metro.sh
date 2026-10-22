#!/usr/bin/env bash
# Starts Metro for Expo Go or for an already-installed development build.
# Usage: bash scripts/metro.sh go|dev-client [lan|tunnel|localhost] [extra Expo args]
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

client="${1:-}"
[[ "$client" == "go" || "$client" == "dev-client" ]] || fail "Usage: bash scripts/metro.sh go|dev-client [lan|tunnel|localhost]"
shift
connection="lan"
if (($#)) && [[ "$1" != --* ]]; then connection="$1"; shift; fi
case "$connection" in
  lan) connection_args=() ;;
  tunnel) connection_args=(--tunnel) ;;
  localhost) connection_args=(--localhost) ;;
  *) fail "Connection must be lan, tunnel or localhost." ;;
esac

require_dependencies
cd "$APP_ROOT"
if [[ "$client" == "go" ]]; then
  heading "Starting Metro for Expo Go ($connection)"
  info "Expo Go runs only the standard Expo SDK. Custom native modules need the development build."
else
  heading "Starting Metro for the installed development build ($connection)"
fi
exec bunx expo start "--$client" "${connection_args[@]}" "$@"
