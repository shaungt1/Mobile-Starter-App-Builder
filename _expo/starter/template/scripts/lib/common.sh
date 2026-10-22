#!/usr/bin/env bash
# Shared helpers for this app's Bash scripts. Sourced, never executed directly.
# APP_ROOT is the application folder (the parent of scripts/).

SCRIPTS_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
APP_ROOT="$(cd -- "$SCRIPTS_DIR/.." && pwd)"

heading() { printf '\n==> %s\n' "$1"; }
info() { printf '    %s\n' "$1"; }
fail() {
  printf 'error: %s\n' "$1" >&2
  exit 1
}

# Asks a yes/no question. APP_YES=1 answers yes without asking (for agents and CI).
confirm() {
  local prompt="${1:-Continue?}" reply
  if [[ "${APP_YES:-0}" == "1" ]]; then return 0; fi
  [[ -t 0 ]] || fail "$prompt Re-run interactively or set APP_YES=1."
  read -r -p "$prompt [y/N] " reply
  [[ "$reply" =~ ^[Yy]$ ]]
}

require_bun() {
  command -v bun >/dev/null 2>&1 || fail "Bun is required. Run 'bash start.sh setup' first."
}

require_dependencies() {
  require_bun
  [[ -d "$APP_ROOT/node_modules" ]] || fail "Dependencies are missing. Run 'bash start.sh setup' first."
}

# Reads one value from app.json, for example: app_json_value expo.android.package
app_json_value() {
  node -e '
    const value = process.argv[2].split(".").reduce((node, key) => node?.[key], require(process.argv[1]));
    if (value === undefined || value === null || value === "") process.exit(1);
    process.stdout.write(String(value));
  ' "$APP_ROOT/app.json" "$1"
}

resolve_eas() {
  require_bun
  if command -v eas >/dev/null 2>&1; then EAS_CMD=(eas); else EAS_CMD=(bunx eas-cli); fi
}

# Makes sure an Expo account is logged in and the app is linked to an EAS project,
# offering to fix each one interactively.
ensure_eas_ready() {
  resolve_eas
  heading "Checking Expo account"
  if ! "${EAS_CMD[@]}" whoami >/dev/null 2>&1; then
    info "No active EAS login was found."
    confirm "Log in to Expo now?" || fail "EAS login is required."
    "${EAS_CMD[@]}" login
  fi
  heading "Checking EAS project link"
  if ! "${EAS_CMD[@]}" project:info >/dev/null 2>&1; then
    info "This checkout is not linked to an EAS project."
    confirm "Run 'eas init' now?" || fail "Run 'bunx eas-cli init' first."
    "${EAS_CMD[@]}" init
  fi
}
