#!/usr/bin/env bash
# Builds, installs and launches the development build in the iOS Simulator (macOS with Xcode only).
# On Windows and Linux, build iOS in the cloud instead: bash start.sh release build development ios
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

[[ "$(uname -s)" == "Darwin" ]] || fail "The iOS Simulator needs macOS with Xcode. On this machine use an EAS cloud build for iOS."
require_dependencies
cd "$APP_ROOT"
heading "Building, installing and launching in the iOS Simulator"
exec bunx expo run:ios "$@"
