#!/usr/bin/env bash
# Local release builds (nothing is uploaded or published).
#   android [--apk|--aab]   signed builds need signing set up first (docs/reference/13-distribution-stores.md)
#   ios                     macOS only; needs bundle.iOS.developmentTeam or APPLE_DEVELOPMENT_TEAM
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/android-env.sh"

target="${1:-}"
if (($#)); then shift; fi
require_dependencies
require_rust
cd "$APP_ROOT"
bash scripts/verify.sh
case "$target" in
  android) configure_android_env; exec bun run tauri android build "$@" ;;
  ios)
    [[ "$(uname -s)" == "Darwin" ]] || fail "iOS builds need macOS with Xcode."
    exec bun run tauri ios build "$@"
    ;;
  *) echo "Usage: bash start.sh build android [--apk|--aab] | ios" >&2; exit 2 ;;
esac
