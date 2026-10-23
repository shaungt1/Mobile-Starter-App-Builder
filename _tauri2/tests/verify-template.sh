#!/usr/bin/env bash
# Generates every frontend x UI-kit combination into temporary folders and runs
# install, TypeScript, Biome, Vitest and the production web build on each.
# With --rust it also runs `cargo test` and `cargo clippy -D warnings` on the
# first combination (slow on the first run: Rust compiles Tauri).
set -Eeuo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
TAURI="$(cd -- "$HERE/.." && pwd)"
rust=0
[[ "${1:-}" == "--rust" ]] && rust=1
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

combos=("vite shadcn ios" "nextjs shadcn ios" "vite konsta ios" "nextjs konsta material")
index=0
for combo in "${combos[@]}"; do
  read -r frontend ui theme <<<"$combo"
  index=$((index + 1))
  app="$work/app$index"
  node -e '
    const [frontend, ui, uiTheme, file] = process.argv.slice(1);
    require("fs").writeFileSync(file, JSON.stringify({ name: "Check App", slug: "check-app", bundleId: "com.example.checkapp", frontend, ui, uiTheme, capabilities: ["haptics", "sql"] }));
  ' "$frontend" "$ui" "$theme" "$work/plan$index.json"
  echo "==> $frontend + $ui ($theme)"
  node "$TAURI/generator/create-app.mjs" "$app" --plan "$work/plan$index.json" >/dev/null
  (
    cd "$app"
    bun install >/dev/null
    bun run typecheck >/dev/null
    bun run lint >/dev/null
    bun run test >/dev/null
    bun run build >/dev/null
  )
  echo "    typecheck, lint, unit tests and production build passed"
  if ((rust && index == 1)); then
    (cd "$app" && cargo test --manifest-path src-tauri/Cargo.toml --quiet && cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --quiet -- -D warnings)
    echo "    cargo test and clippy passed"
  fi
done
echo "All Tauri template combinations passed."
