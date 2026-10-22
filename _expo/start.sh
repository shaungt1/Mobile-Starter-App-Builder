#!/usr/bin/env bash
set -Eeuo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
STARTUP="$ROOT/scripts/startup"

usage() {
  cat <<'EOF'
Usage: bash start.sh expo COMMAND [arguments]   (or bash _expo/start.sh COMMAND)

Commands:
  create TARGET --plan PLAN.json [--install]
      Generate from the owned local template and apply identity/theme from one plan.
  clean TARGET [--components "button card text"]
      Brand-new app from Expo's current template + NativeWind + React Native Reusables.
  starter verify
      Verify generator tests and the owned template.
  system
      Read-only host capability report.
  bootstrap TARGET --name NAME --slug SLUG --bundle-id ID [options]
      Clone, detach, configure, install, and verify a new app.
  setup TARGET [--fix-expo] [--skip-verify]
      Install an existing app and create .env without overwriting it. Expo fixes are opt-in.
  configure TARGET --name NAME --slug SLUG --bundle-id ID [--scheme SCHEME]
      Update generic Expo identity fields.
  verify TARGET
      Run Expo Doctor and every available project check.
  run TARGET web|go|go-tunnel|dev-client|android|ios [extra Expo args]
      Start the selected development surface or local native run.
  capabilities list|show ID|install ID TARGET [--apply] [--no-verify]
      Inspect or install one optional capability.
  release TARGET build PROFILE PLATFORM [--yes] [--skip-checks]
  release TARGET update CHANNEL MESSAGE [--yes] [--skip-checks]
  release TARGET submit PLATFORM [--yes]
  release TARGET web preview|production [--yes] [--skip-checks]
      Guarded EAS release operations.
  help
EOF
}

command="${1:-help}"
if (($#)); then shift; fi

case "$command" in
  create) node "$ROOT/starter/generator/create-app.mjs" "$@" ;;
  clean) bash "$ROOT/clean/create-clean.sh" "$@" ;;
  starter)
    subcommand="${1:-}"
    if [[ "$subcommand" != "verify" ]]; then usage; exit 2; fi
    node --test "$ROOT/tests/generator.test.mjs"
    bash "$ROOT/starter/template/scripts/verify.sh"
    ;;
  system) node "$ROOT/code/check-system.mjs" "$@" ;;
  bootstrap) bash "$STARTUP/bootstrap.sh" "$@" ;;
  setup) bash "$STARTUP/setup.sh" "$@" ;;
  configure) bash "$STARTUP/configure.sh" "$@" ;;
  verify) bash "$STARTUP/verify.sh" "$@" ;;
  run) bash "$STARTUP/run.sh" "$@" ;;
  capabilities) node "$STARTUP/capabilities.mjs" "$@" ;;
  release) bash "$STARTUP/release.sh" "$@" ;;
  help|-h|--help) usage ;;
  *) usage; printf '\nerror: unknown command: %s\n' "$command" >&2; exit 1 ;;
esac
