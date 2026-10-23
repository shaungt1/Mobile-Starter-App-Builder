#!/usr/bin/env bash
# Tauri 2 mobile toolkit (run through the root start.sh as: bash start.sh tauri <command>).
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'USAGE'
Usage: bash start.sh tauri COMMAND

  create TARGET --plan PLAN.json [--install]   Generate a Tauri 2 mobile app (or use: bash start.sh new --platform tauri)
  capability list                              Mobile plugins and UI kits that can be added
  capability show ID                           What one capability installs and requires
  capability install ID APP [--no-install]     Add one capability to a generated app
  starter verify                               Generate every frontend/UI combination into a temp folder and check it
  system                                       Read-only machine report for Tauri mobile
USAGE
}

command="${1:-help}"
if (($#)); then shift; fi
case "$command" in
  create) node "$ROOT/generator/create-app.mjs" "$@" ;;
  capability | capabilities) node "$ROOT/generator/capabilities.mjs" "$@" ;;
  starter)
    [[ "${1:-}" == "verify" ]] || { usage; exit 2; }
    bash "$ROOT/tests/verify-template.sh"
    ;;
  system) node "$ROOT/template/scripts/check-system.mjs" ;;
  help | -h | --help) usage ;;
  *) usage; printf '\nerror: unknown command: %s\n' "$command" >&2; exit 2 ;;
esac
