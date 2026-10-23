#!/usr/bin/env bash
# Shared helpers for this app's Bash scripts. Sourced, never executed directly.
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

# Tools installed in user folders are not always on PATH in a new Git Bash window.
for dir in "$HOME/.bun/bin" "$HOME/.cargo/bin"; do
  [[ -d "$dir" ]] && PATH="$dir:$PATH"
done
export PATH

require_bun() { command -v bun >/dev/null 2>&1 || fail "Bun is required. Run 'bash start.sh setup' first."; }
require_dependencies() {
  require_bun
  [[ -d "$APP_ROOT/node_modules" ]] || fail "Dependencies are missing. Run 'bash start.sh setup' first."
}
require_rust() { command -v cargo >/dev/null 2>&1 || fail "Rust is required (https://rustup.rs). The builder's install-prereqs script installs it."; }
