#!/usr/bin/env bash
# Every static and unit check: TypeScript, Biome lint/format, Vitest, the
# production web build, and the Rust unit tests (when Rust is installed).
set -Eeuo pipefail
SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/common.sh"

require_dependencies
cd "$APP_ROOT"
heading "TypeScript"
bun run typecheck
heading "Lint and format (Biome)"
bun run lint
heading "Unit tests (Vitest)"
bun run test
heading "Production web build"
bun run build
if command -v cargo >/dev/null 2>&1; then
  heading "Rust unit tests"
  bun run test:rust
else
  info "Rust is not installed; skipped 'cargo test'. Install it before building the app."
fi
heading "Verification passed"
