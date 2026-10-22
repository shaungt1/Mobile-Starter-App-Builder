#!/usr/bin/env bash
# Runs the app in a web browser. Use the browser's responsive-device mode for phone
# and tablet sizes. Native-only modules (Bluetooth, camera vision, purchases) do not run here.
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

require_dependencies
cd "$APP_ROOT"
heading "Starting the web build"
exec bunx expo start --web "$@"
