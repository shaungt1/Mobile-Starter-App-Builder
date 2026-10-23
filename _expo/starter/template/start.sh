#!/usr/bin/env bash
# Single entry point for this app. Run with no command for an interactive menu.
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
S="$ROOT/scripts"

usage() {
  cat <<'USAGE'
Usage: bash start.sh [command]

  setup              Check the machine, install locked dependencies, create .env, verify
  verify             Expo Doctor, typecheck, lint, format, unit tests, unused-code check
  run web            Browser (responsive-device mode for phone sizes)
  run go             Expo Go over the local network (standard Expo SDK only)
  run go-tunnel      Expo Go through a tunnel (phone on another network)
  run android        Build, install and launch on an Android emulator (boots one if needed)
  run usb            Build, install and launch on a USB-connected Android phone
  run ios            Build, install and launch in the iOS Simulator (macOS only)
  run dev-client     Metro for an already-installed development build
  theme              Apply PROJECT_PLAN.json theme tokens to global.css
  system             Read-only machine report
  devices            Connected phones, emulators, simulators and serial ports
  config             App identity and environment checks
  release ARGS       Guarded EAS command (ALLOW_RELEASE=yes required), e.g. build --profile preview -p android
  help               This help
USAGE
}

dispatch() {
  local command="${1:-help}"
  if (($#)); then shift; fi
  case "$command" in
    setup) bash "$S/setup.sh" "$@" ;;
    verify) bash "$S/verify.sh" "$@" ;;
    run) bash "$S/run.sh" "$@" ;;
    theme) node "$S/apply-theme.mjs" "$@" ;;
    system) node "$S/check-system.mjs" ;;
    devices) node "$S/check-devices.mjs" ;;
    config) node "$S/check-config.mjs" ;;
    release) bash "$S/release.sh" "$@" ;;
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

  1) Setup / refresh dependencies      7) iOS Simulator (macOS)
  2) Verify (all checks)               8) Dev client (installed build)
  3) Web browser                       9) Machine report
  4) Expo Go (LAN)                    10) Connected devices
  5) Android emulator                 11) Config check
  6) USB Android phone                 0) Exit
MENU
  read -r -p "Choose: " choice
  case "$choice" in
    1) dispatch setup ;; 2) dispatch verify ;; 3) dispatch run web ;; 4) dispatch run go ;;
    5) dispatch run android ;; 6) dispatch run usb ;; 7) dispatch run ios ;; 8) dispatch run dev-client ;;
    9) dispatch system ;; 10) dispatch devices ;; 11) dispatch config ;; 0) exit 0 ;;
    *) echo "Unknown option: $choice" ;;
  esac || true
done
