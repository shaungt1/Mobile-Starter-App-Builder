#!/usr/bin/env bash
# Mobile Starter App Builder - single entry point (Git Bash on Windows, macOS, Linux).
# Run with no command for an interactive menu.
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"

usage() {
  cat <<'USAGE'
Usage: bash start.sh [command] [options]

Create an app (in another folder or an existing new GitHub repository)
  new [options]                 Guided: asks for platform, folder or repo, name, ID, UI (see: new --help)

Prepare this machine
  doctor [--platform expo|tauri|all]            Read-only report of installed tools
  install-prereqs [--platform ...] [--dry-run]  Install missing tools (asks once)
  android-setup [--dry-run] [--set-env]         Android SDK packages, NDK and an emulator

Platform toolkits
  expo <command>                Expo toolkit: create, setup, verify, run, capabilities, feature, release (expo help)
  tauri <command>               Tauri 2 toolkit: create, capability, verify (tauri help)

Builder maintenance
  verify                        Run the builder's own tests and script checks
  help                          This help
USAGE
}

dispatch() {
  local command="${1:-help}"
  if (($#)); then shift; fi
  case "$command" in
    new) node "$ROOT/scripts/new-app.mjs" "$@" ;;
    doctor) node "$ROOT/scripts/doctor.mjs" "$@" ;;
    install-prereqs) bash "$ROOT/scripts/install-prereqs.sh" "$@" ;;
    android-setup) bash "$ROOT/scripts/android-setup.sh" "$@" ;;
    expo) bash "$ROOT/_expo/start.sh" "$@" ;;
    tauri) bash "$ROOT/_tauri2/start.sh" "$@" ;;
    verify) bash "$ROOT/scripts/verify-builder.sh" "$@" ;;
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

  Mobile Starter App Builder
  1) Create a new app (guided)        4) Android SDK + emulator setup
  2) Check this machine               5) Expo capability catalog
  3) Install missing tools            6) Tauri capability catalog
  0) Exit
MENU
  read -r -p "Choose: " choice
  case "$choice" in
    1) dispatch new ;; 2) dispatch doctor ;; 3) dispatch install-prereqs ;; 4) dispatch android-setup ;;
    5) dispatch expo capabilities list ;; 6) dispatch tauri capability list ;; 0) exit 0 ;;
    *) echo "Unknown option: $choice" ;;
  esac || true
done
