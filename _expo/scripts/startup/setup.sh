#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

(($# >= 1)) || fail "Usage: setup.sh TARGET [--fix-expo] [--skip-verify]"
target="$1"
shift
SKIP_VERIFY=0
FIX_EXPO=0
while (($#)); do
  case "$1" in
    --fix-expo) FIX_EXPO=1 ;;
    --skip-verify) SKIP_VERIFY=1 ;;
    *) fail "Unknown setup option: $1" ;;
  esac
  shift
done

require_app "$target"
command -v git >/dev/null 2>&1 || fail "Git is required."
command -v node >/dev/null 2>&1 || fail "Node.js is required."
NODE_OK="$(node -p "const [a,b]=process.versions.node.split('.').map(Number); a>22||(a===22&&b>=18)")"
[[ "$NODE_OK" == "true" ]] || fail "Current template and Supabase client tooling require Node 22.18+; found $(node --version)."
require_bun

cd "$APP_ROOT"
heading "Installing dependencies"
if [[ -f bun.lock || -f bun.lockb ]]; then bun install --frozen-lockfile; else bun install; fi

if ((FIX_EXPO)); then
  node "$SCRIPT_DIR/ensure-baseline-plugins.mjs" "$APP_ROOT"
  heading "Aligning packages with the installed Expo SDK"
  bunx expo install --fix
  heading "Reinstalling clean dependency tree after Expo alignment"
  node "$SCRIPT_DIR/clean-node-modules.mjs" "$APP_ROOT"
  bun install --frozen-lockfile
fi

heading "Preparing local environment"
if [[ -f .env ]]; then
  info ".env exists; left unchanged."
elif [[ -f .env.example ]]; then
  cp .env.example .env
  info "Created .env from .env.example."
else
  cp "$PLAYBOOK_ROOT/code/env.example" .env.example
  cp .env.example .env
  info "Added the generic environment contract and created .env."
fi

if ((SKIP_VERIFY == 0)); then bash "$SCRIPT_DIR/verify.sh" "$APP_ROOT"; fi
heading "Setup complete"
