#!/usr/bin/env bash
# Every static and unit check. Expo Doctor needs network access to the Expo API;
# set APP_SKIP_DOCTOR=1 only on machines that cannot reach it, and say so in any report.
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

require_dependencies
cd "$APP_ROOT"
node scripts/check-config.mjs
if [[ "${APP_SKIP_DOCTOR:-0}" == "1" ]]; then
  info "Expo Doctor skipped (APP_SKIP_DOCTOR=1)."
else
  heading "Expo Doctor"
  bunx expo-doctor || {
    echo "Expo Doctor failed. If it lists packages behind the SDK patch set, run: bash start.sh setup --fix-expo" >&2
    exit 1
  }
fi
heading "TypeScript"
bun run typecheck
heading "Lint"
bun run lint
heading "Formatting"
bun run format:check
heading "Unit tests"
bun run test:unit
heading "Unused code and dependencies"
bun run check:unused
heading "Verification passed"
