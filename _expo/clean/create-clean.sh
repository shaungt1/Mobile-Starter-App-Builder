#!/usr/bin/env bash
# Creates a brand-new Expo app from Expo's current official template (instead of the
# owned, pinned template) and adds the UI foundation this builder standardizes on:
# NativeWind (Tailwind for React Native), React Native Reusables (shadcn/ui for
# React Native), Reanimated, gestures, SVG, haptics and Lucide icons.
#
# Usage: bash _expo/clean/create-clean.sh TARGET [--components "button card text input"] [--skip-checks]
#
# TARGET may be new, empty, or a new repository with only README/LICENSE/.git/ignore files;
# the app is built in a temporary folder and copied in without overwriting anything.
# The result is a small typed starter (one screen) with Expo's demo removed.
# Use this path to start on the newest Expo SDK; use `start.sh new --platform expo` for the
# owned template, which already contains auth, payments, analytics, local SQL and scripts.
set -Eeuo pipefail
HERE="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
BUILDER="$(cd -- "$HERE/../.." && pwd)"

target="${1:-}"
[[ -n "$target" && "$target" != --* ]] || { sed -n '2,13p' "$0"; exit 2; }
shift
components="button card text input label separator badge"
skip_checks=0
while (($#)); do
  case "$1" in
    --components) components="$2"; shift 2 ;;
    --skip-checks) skip_checks=1; shift ;;
    *) echo "error: unknown option $1" >&2; exit 2 ;;
  esac
done

command -v bun >/dev/null 2>&1 || { echo "error: Bun is required (bash start.sh install-prereqs)." >&2; exit 1; }
# Refuse unsafe targets before downloading anything.
node --input-type=module -e "import('$BUILDER/scripts/lib/target.mjs').then(({ inspectTarget }) => inspectTarget(process.argv[1], { builderRoot: process.argv[2] }))" "$target" "$BUILDER"

work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT
app="$work/app"

echo "==> Creating the app from Expo's default template (latest SDK)"
bunx create-expo-app@latest "$app" --template default --yes

cd "$app"
echo "==> Removing Expo's demo screens (its own reset-project script, delete mode)"
# The SDK 58 demo does not type-check as shipped (seen with create-expo-app on 2026-10-22).
echo n | node scripts/reset-project.js >/dev/null
node -e 'const f="package.json",p=require("./"+f);delete p.scripts["reset-project"];require("fs").writeFileSync(f,JSON.stringify(p,null,2)+"\n")'
rm -rf scripts/reset-project.js example

echo "==> Installing the UI foundation (versions chosen by expo install for this SDK)"
bunx expo install nativewind react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-svg expo-haptics
bun add clsx tailwind-merge class-variance-authority tailwindcss-animate lucide-react-native
bun add -d "tailwindcss@^3.4.17"

echo "==> Adding NativeWind and design-token configuration"
cp -R "$HERE/files/." "$app/"

echo "==> Adding React Native Reusables components: $components"
# shellcheck disable=SC2086 # the component list is intentionally split into words
bunx @react-native-reusables/cli@latest add $components --yes --styling-library nativewind || true
missing=0
for component in $components; do [[ -f "src/components/ui/$component.tsx" ]] || missing=1; done
if ((missing)); then
  # The CLI downloads from reactnativereusables.com; when that is unreachable, use the
  # same components from the builder's owned template (pinned, already verified).
  echo "    Registry unreachable or incomplete; copying the components from the owned template instead."
  mkdir -p src/components/ui
  for component in $components; do
    source_file="$BUILDER/_expo/starter/template/src/components/ui/$component.tsx"
    [[ -f "$source_file" ]] || { echo "error: no offline copy of component '$component'" >&2; exit 1; }
    sed 's#@/lib/cn#@/lib/utils#' "$source_file" > "src/components/ui/$component.tsx"
  done
  bun add @rn-primitives/slot @rn-primitives/label @rn-primitives/separator @rn-primitives/portal
fi

if ((skip_checks == 0)); then
  echo "==> TypeScript"
  bunx tsc --noEmit
  echo "==> Web export (compiles every route and the NativeWind styles)"
  bunx expo export --platform web --output-dir "$work/web-export" >/dev/null
fi

echo "==> Copying into $target"
node --input-type=module -e "
  const { inspectTarget, copyTemplate, ensureGitRepository } = await import('$BUILDER/scripts/lib/target.mjs');
  const { target, existing, hasGit } = inspectTarget(process.argv[1], { builderRoot: process.argv[3] });
  for (const note of copyTemplate(process.argv[2], target, existing, { extraSkip: [] })) console.log('  - ' + note);
  console.log('  - ' + ensureGitRepository(target, hasGit));
" "$target" "$app" "$BUILDER"
[[ -f "$target/.gitattributes" ]] || cp "$BUILDER/_expo/code/gitattributes" "$target/.gitattributes"

echo
echo "Clean Expo app ready at $target"
echo "Next: cd \"$target\" && bun install && bunx expo start"
