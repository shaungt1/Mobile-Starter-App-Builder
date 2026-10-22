#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

(($# >= 1)) || fail "Usage: configure.sh TARGET --name NAME --slug SLUG --bundle-id ID [--scheme SCHEME]"
target="$1"
shift
require_app "$target"
node "$SCRIPT_DIR/configure-app.mjs" "$APP_ROOT" "$@"
