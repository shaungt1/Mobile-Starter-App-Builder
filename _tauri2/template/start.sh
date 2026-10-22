#!/usr/bin/env bash
# Single entry point for this Tauri 2 mobile app. Run with no command for a menu.
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
S="$ROOT/scripts"

usage() {
  cat <<'USAGE'
Usage: bash start.sh [command]

  setup             Check the machine, install dependencies, create .env and native projects, verify
  verify            TypeScript, Biome, Vitest, production web build, Rust tests
  run web           Browser preview (no Rust commands)
  run desktop       Tauri window on this computer, phone-sized
  run android       Android emulator or USB phone (Tauri asks which)
  run ios           iOS Simulator or iPhone (macOS only)
  build android     Local APK/AAB build (add --apk or --aab)
  build ios         Local iOS build (macOS only)
  theme             Apply PROJECT_PLAN.json theme tokens
  icons             Regenerate every icon from app-icon.png
  system            Read-only machine report
  help              This help
USAGE
}

dispatch() {
  local command="${1:-help}"
  if (($#)); then shift; fi
  case "$command" in
    setup) bash "$S/setup.sh" "$@" ;;
    verify) bash "$S/verify.sh" "$@" ;;
    run) bash "$S/run.sh" "$@" ;;
    build) bash "$S/build.sh" "$@" ;;
    theme) (cd "$ROOT" && node "$S/apply-theme.mjs") ;;
    icons) (cd "$ROOT" && bun run icons) ;;
    system) node "$S/check-system.mjs" ;;
    help | -h | --help) usage ;;
    *) usage; printf '\nerror: unknown command: %s\n' "$command" >&2; return 2 ;;
  esac
}

if (($#)); then
  dispatch "$@"
  exit $?
fi
while true; do
  cat <<'MENU'

  1) Setup            4) Run desktop preview   7) Machine report
  2) Verify           5) Run on Android        0) Exit
  3) Run in browser   6) Run on iOS (macOS)
MENU
  read -r -p "Choose: " choice
  case "$choice" in
    1) dispatch setup ;; 2) dispatch verify ;; 3) dispatch run web ;; 4) dispatch run desktop ;;
    5) dispatch run android ;; 6) dispatch run ios ;; 7) dispatch system ;; 0) exit 0 ;;
    *) echo "Unknown option: $choice" ;;
  esac || true
done
