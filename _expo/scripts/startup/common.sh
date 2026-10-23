#!/usr/bin/env bash

STARTUP_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck disable=SC2034 # used by the scripts that source this file
PLAYBOOK_ROOT="$(cd -- "$STARTUP_DIR/../.." && pwd)"

heading() { printf '\n==> %s\n' "$1"; }
info() { printf '    %s\n' "$1"; }
fail() { printf 'error: %s\n' "$1" >&2; exit 1; }

confirm() {
  local prompt="${1:-Continue?}" reply
  if [[ "${STARTER_YES:-0}" == "1" ]]; then return 0; fi
  [[ -t 0 ]] || fail "$prompt Re-run interactively or pass --yes."
  read -r -p "$prompt [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

resolve_target() {
  local candidate="${1:-}"
  [[ -n "$candidate" ]] || fail "A target application directory is required."
  [[ -d "$candidate" ]] || fail "Target directory does not exist: $candidate"
  APP_ROOT="$(cd -- "$candidate" && pwd)"
}

require_app() {
  resolve_target "$1"
  [[ -f "$APP_ROOT/package.json" ]] || fail "No package.json found in $APP_ROOT"
}

require_bun() {
  command -v bun >/dev/null 2>&1 || fail "Bun is required: https://bun.sh/docs/installation"
}

has_script() {
  node -e "const p=require(process.argv[1]); process.exit(p.scripts?.[process.argv[2]] ? 0 : 1)" \
    "$APP_ROOT/package.json" "$1"
}

resolve_eas() {
  require_bun
  if command -v eas >/dev/null 2>&1; then EAS_CMD=(eas); else EAS_CMD=(bunx eas-cli); fi
}

ensure_eas_ready() {
  resolve_eas
  heading "Checking Expo account"
  "${EAS_CMD[@]}" whoami >/dev/null 2>&1 || fail "Log in first with 'bunx eas-cli login'."
  heading "Checking EAS project link"
  "${EAS_CMD[@]}" project:info >/dev/null 2>&1 || fail "Link the app first with 'bunx eas-cli init'."
}
