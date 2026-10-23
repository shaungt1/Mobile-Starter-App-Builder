#!/usr/bin/env bash
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
bash scripts/verify.sh
if [[ "${ALLOW_RELEASE:-}" != "yes" ]]; then
  echo 'Release blocked. Re-run with ALLOW_RELEASE=yes after reviewing the exact EAS command.' >&2
  exit 2
fi
bunx eas-cli "$@"
