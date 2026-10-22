#!/usr/bin/env bash
# Builds, installs and launches the development build on an Android emulator,
# booting an Android Virtual Device first when none is running.
# Set APP_AVD=<name> to skip the emulator prompt.
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/android.sh"

require_dependencies
configure_android_toolchain
serial="$(select_android_serial emulator || true)"
if [[ -z "$serial" ]]; then
  start_android_avd
  serial="$(select_android_serial emulator)" || fail "The Android emulator started but ADB cannot see it."
fi
install_and_run_android_target "$serial"
