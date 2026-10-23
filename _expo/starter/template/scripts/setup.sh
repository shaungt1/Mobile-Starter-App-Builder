#!/usr/bin/env bash
# Prepares a fresh checkout: checks the machine, installs the locked dependencies,
# creates .env from .env.example without overwriting it, then runs every check.
# Options: --skip-verify, --fix-expo (align Expo packages with the versions the installed SDK expects)
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

skip_verify=0
fix_expo=0
for arg in "$@"; do
  case "$arg" in
    --skip-verify) skip_verify=1 ;;
    --fix-expo) fix_expo=1 ;;
    *) fail "Unknown setup option: $arg" ;;
  esac
done

cd "$APP_ROOT"
heading "Checking this machine"
node scripts/check-system.mjs --require-core

if ! command -v bun >/dev/null 2>&1; then
  command -v npm >/dev/null 2>&1 || fail "Install Bun (https://bun.sh/docs/installation), then run setup again."
  confirm "Bun is missing. Install it globally with npm?" || fail "Bun is required."
  npm install --global bun
  hash -r
fi

heading "Installing locked dependencies"
if [[ -f .mobile-builder/lock-stale ]]; then
  # A feature was added or removed without installing; refresh the lockfile once.
  bun install
  rm -f .mobile-builder/lock-stale
else
  bun install --frozen-lockfile
fi

if ((fix_expo)); then
  # Expo publishes patch releases of an SDK continuously; Expo Doctor fails when installed packages lag them.
  # `expo install --fix` rewrites the ranges, then a clean reinstall removes duplicate nested modules Bun can leave behind.
  heading "Aligning packages with the installed Expo SDK"
  bunx expo install --fix || info "expo install --fix reported an error; checking whether the packages were updated anyway."
  node -e 'require("fs").rmSync("node_modules", { recursive: true, force: true, maxRetries: 10, retryDelay: 250 })'
  bun install
fi

heading "Preparing local environment"
if [[ -f .env ]]; then
  info ".env exists; left unchanged."
else
  cp .env.example .env
  info "Created .env from .env.example. Services stay disabled until their public keys are added."
fi

if ((skip_verify == 0)); then bash scripts/verify.sh; fi
heading "Setup complete"
info "Next: bash start.sh run web   (or go, android, usb, ios, dev-client)"
