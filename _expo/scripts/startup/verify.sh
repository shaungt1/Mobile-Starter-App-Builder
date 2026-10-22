#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

(($# == 1)) || fail "Usage: verify.sh TARGET"
require_app "$1"
require_bun
[[ -d "$APP_ROOT/node_modules" ]] || fail "Dependencies are missing. Run setup first."
cd "$APP_ROOT"

heading "Expo Doctor"
bunx expo-doctor

run_check() {
  local script="$1" label="$2"
  if has_script "$script"; then heading "$label"; bun run "$script"; else info "Skipped $label (no '$script' script)."; fi
}

run_check typecheck "TypeScript"
run_check lint "Lint"
if has_script test:ci; then
  heading "Unit tests"
  bun run test:ci
elif has_script test; then
  heading "Unit tests"
  bun run test -- --runInBand
else
  info "Skipped unit tests (no test script)."
fi
run_check format:check "Formatting"
if has_script check:unused; then run_check check:unused "Unused code/dependencies"; else run_check knip "Unused code/dependencies"; fi
heading "Verification passed"
