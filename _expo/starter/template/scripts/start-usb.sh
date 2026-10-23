#!/usr/bin/env bash
# Builds, installs and launches the development build on a physical Android phone
# connected by USB (USB debugging on, computer authorized on the phone).
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"
source "$SCRIPT_DIR/lib/android.sh"

require_dependencies
configure_android_toolchain
serial="$(select_android_serial usb || true)"
[[ -n "$serial" ]] || fail "No authorized Android phone is connected through USB. Enable USB debugging and accept the prompt on the phone."
install_and_run_android_target "$serial"
