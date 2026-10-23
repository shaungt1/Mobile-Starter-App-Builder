#!/usr/bin/env bash
# Checks the builder itself: unit tests for both generators and the shared
# target rules, Bash syntax and ShellCheck (when installed), and JSON validity.
# Pass --full to also generate and check every Tauri combination (with Rust) and a
# complete Expo app (Expo Doctor needs network; set APP_SKIP_DOCTOR=1 where the Expo API is unreachable).
set -Eeuo pipefail
ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "==> Unit tests (node:test)"
node --test tests/*.test.mjs _expo/tests/*.test.mjs _tauri2/tests/*.test.mjs

echo "==> Bash syntax"
mapfile -t scripts < <(git ls-files --cached --others --exclude-standard '*.sh' | grep -v '^_expo/starter/upstream-snapshot/')
for file in "${scripts[@]}"; do bash -n "$file"; done
if command -v shellcheck >/dev/null 2>&1; then
  echo "==> ShellCheck"
  # shellcheck disable=SC2046 # one file per line
  shellcheck -x -P SCRIPTDIR -S warning $(printf '%s\n' "${scripts[@]}" | grep -v 'setup-eas-env\|setup-revenuecat')
else
  echo "    ShellCheck not installed; skipped."
fi

echo "==> JSON validity"
git ls-files --cached --others --exclude-standard '*.json' | grep -v '^_expo/starter/upstream-snapshot/' | while read -r file; do
  node -e 'JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"))' "$file" || { echo "invalid JSON: $file"; exit 1; }
done

if [[ "${1:-}" == "--full" ]]; then
  bash _tauri2/tests/verify-template.sh --rust
  echo "==> Expo owned template: generate, install, verify"
  work="$(mktemp -d)"
  node _expo/starter/generator/create-app.mjs "$work/expo-app" --plan _expo/starter/project-plan.example.json >/dev/null
  (cd "$work/expo-app" && bash start.sh setup)
  echo "==> Expo features: remove all, check, add back, add the funnel, check"
  app="$work/expo-app"
  check_app() { (cd "$app" && bun run typecheck && bun run lint && bun run format:check && bun run check:unused && bun run test:unit); }
  features=(notifications analytics payments auth local-db device-kit ota-updates)
  for id in "${features[@]}"; do node _expo/scripts/features.mjs remove "$id" "$app"; done
  check_app
  for ((i = ${#features[@]} - 1; i >= 0; i--)); do node _expo/scripts/features.mjs add "${features[i]}" "$app"; done
  node _expo/scripts/features.mjs add funnel "$app"
  check_app
  rm -rf "$work"
fi
echo "Builder verification passed."
