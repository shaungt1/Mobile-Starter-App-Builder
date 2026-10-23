#!/usr/bin/env bash
# One entry point for every runtime surface.
#   web       browser only (fast UI loop; no Rust commands)
#   desktop   Tauri window on this computer, sized like a phone
#   android   emulator or USB phone; Tauri asks which when several are attached
#   ios       iOS Simulator or iPhone (macOS only)
# Extra arguments go to Tauri, for example a device name: bash start.sh run ios "iPhone 16"
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/android-env.sh"

mode="${1:-}"
if (($#)); then shift; fi
require_dependencies
cd "$APP_ROOT"
case "$mode" in
  web) exec bun run dev:web "$@" ;;
  desktop) require_rust; exec bun run tauri dev "$@" ;;
  android)
    require_rust
    configure_android_env
    [[ -d src-tauri/gen/android ]] || bun run tauri android init --ci
    exec bun run tauri android dev "$@"
    ;;
  ios)
    [[ "$(uname -s)" == "Darwin" ]] || fail "iOS builds need macOS with Xcode; the Tauri CLI has no iOS commands on this OS."
    require_rust
    [[ -d src-tauri/gen/apple ]] || bun run tauri ios init --ci
    exec bun run tauri ios dev "$@"
    ;;
  *)
    echo "Usage: bash start.sh run web|desktop|android|ios [device or Tauri options]" >&2
    exit 2
    ;;
esac
