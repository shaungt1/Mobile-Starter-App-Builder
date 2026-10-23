#!/usr/bin/env bash
# Prepares a fresh checkout: checks the machine, installs dependencies, creates
# .env, creates the native Android project (and the iOS project on macOS) when
# the tools are present, generates app icons, then runs every check.
# Options: --skip-verify  --skip-native
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/android-env.sh"

skip_verify=0
skip_native=0
for arg in "$@"; do
  case "$arg" in
    --skip-verify) skip_verify=1 ;;
    --skip-native) skip_native=1 ;;
    *) fail "Unknown setup option: $arg" ;;
  esac
done

cd "$APP_ROOT"
heading "Checking this machine"
node scripts/check-system.mjs --require-core
require_bun

heading "Installing dependencies"
bun install

heading "Preparing local environment"
if [[ -f .env ]]; then info ".env exists; left unchanged."; else cp .env.example .env && info "Created .env from .env.example."; fi

if ((skip_native == 0)); then
  if [[ -d src-tauri/gen/android ]]; then
    info "Android project already exists (src-tauri/gen/android)."
  elif (configure_android_env >/dev/null 2>&1); then
    heading "Creating the Android project (tauri android init)"
    configure_android_env
    bun run tauri android init --ci
  else
    info "Android tools not found; skipped 'tauri android init'. Install them, then run: bash start.sh setup"
  fi
  if [[ "$(uname -s)" == "Darwin" ]]; then
    if [[ -d src-tauri/gen/apple ]]; then
      info "iOS project already exists (src-tauri/gen/apple)."
    elif xcodebuild -version >/dev/null 2>&1; then
      heading "Creating the iOS project (tauri ios init)"
      bun run tauri ios init --ci
    else
      info "Full Xcode not found; skipped 'tauri ios init'."
    fi
  fi
  heading "Generating app icons from app-icon.png"
  bun run icons >/dev/null && info "Icons written to src-tauri/icons (and the native projects that exist)."
fi

if ((skip_verify == 0)); then bash scripts/verify.sh; fi
heading "Setup complete"
info "Next: bash start.sh run web | desktop | android | ios"
