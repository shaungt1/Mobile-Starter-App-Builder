#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Usage: bootstrap.sh TARGET --name NAME --slug SLUG --bundle-id ID [options]

Options:
  --scheme SCHEME
  --template-url URL
  --template-ref BRANCH_TAG_OR_COMMIT
  --skip-install
  --skip-verify
  --skip-expo-fix
  --yes
EOF
}

(($# >= 1)) || { usage; exit 1; }
target_input="$1"
shift
TEMPLATE_URL="https://github.com/Simonstorms/expo-app-template.git"
TEMPLATE_REF=""
SKIP_INSTALL=0
SKIP_VERIFY=0
FIX_EXPO=1
CONFIG_ARGS=()
HAS_NAME=0
HAS_SLUG=0
HAS_BUNDLE_ID=0

while (($#)); do
  case "$1" in
    --name|--slug|--scheme|--bundle-id)
      (($# >= 2)) || fail "$1 requires a value."
      case "$1" in
        --name) HAS_NAME=1 ;;
        --slug) HAS_SLUG=1 ;;
        --bundle-id) HAS_BUNDLE_ID=1 ;;
      esac
      CONFIG_ARGS+=("$1" "$2")
      shift 2
      ;;
    --template-url)
      (($# >= 2)) || fail "--template-url requires a value."
      TEMPLATE_URL="$2"
      shift 2
      ;;
    --template-ref)
      (($# >= 2)) || fail "--template-ref requires a value."
      TEMPLATE_REF="$2"
      shift 2
      ;;
    --skip-install) SKIP_INSTALL=1; shift ;;
    --skip-verify) SKIP_VERIFY=1; shift ;;
    --skip-expo-fix) FIX_EXPO=0; shift ;;
    --yes) STARTER_YES=1; shift ;;
    -h|--help) usage; exit 0 ;;
    *) fail "Unknown bootstrap option: $1" ;;
  esac
done

((HAS_NAME)) || fail "--name is required."
((HAS_SLUG)) || fail "--slug is required."
((HAS_BUNDLE_ID)) || fail "--bundle-id is required."

command -v git >/dev/null 2>&1 || fail "Git is required."
command -v node >/dev/null 2>&1 || fail "Node.js is required."

parent="$(cd -- "$(dirname -- "$target_input")" && pwd)"
target="$parent/$(basename -- "$target_input")"
[[ "$target" != "/" && "$target" != "$HOME" && "$target" != "$PLAYBOOK_ROOT" ]] || fail "Unsafe target: $target"
if [[ -e "$target" ]]; then
  [[ -d "$target" ]] || fail "Target exists and is not a directory: $target"
  [[ -z "$(find "$target" -mindepth 1 -maxdepth 1 -print -quit)" ]] || fail "Target must be new or empty: $target"
fi

heading "Bootstrap plan"
info "Source: $TEMPLATE_URL${TEMPLATE_REF:+ @ $TEMPLATE_REF}"
info "Target: $target"
confirm "Clone the template and detach its Git history?" || fail "Bootstrap canceled."

git -c core.autocrlf=false clone -- "$TEMPLATE_URL" "$target"
if [[ -n "$TEMPLATE_REF" ]]; then
  git -C "$target" checkout --detach "$TEMPLATE_REF"
fi

source_commit="$(git -C "$target" rev-parse HEAD)"
source_date="$(git -C "$target" show -s --format=%cs HEAD)"
[[ -f "$target/LICENSE" ]] || fail "The template clone has no LICENSE; review provenance before continuing."

heading "Recording provenance"
if [[ ! -f "$target/NOTICE" ]]; then
  printf 'Third-party source notice\n=========================\n\n' > "$target/NOTICE"
fi
printf '\nThis application is derived from expo-app-template by Simonstorms.\nUpstream: %s\nCommit: %s (%s)\nLicense: MIT (see LICENSE)\n' \
  "$TEMPLATE_URL" "$source_commit" "$source_date" >> "$target/NOTICE"

git_metadata="$target/.git"
[[ -d "$git_metadata" ]] || fail "Expected cloned Git metadata at $git_metadata"
rm -rf -- "$git_metadata"
git -C "$target" init
git -C "$target" branch -M main
cp "$PLAYBOOK_ROOT/code/gitattributes" "$target/.gitattributes"

heading "Configuring application identity"
bash "$SCRIPT_DIR/configure.sh" "$target" "${CONFIG_ARGS[@]}"

if ((SKIP_INSTALL)); then
  heading "Bootstrap complete (installation skipped)"
  info "Next: bash start.sh setup '$target'"
  exit 0
fi

setup_args=()
if ((SKIP_VERIFY)); then setup_args+=(--skip-verify); fi
if ((FIX_EXPO)); then setup_args+=(--fix-expo); fi
bash "$SCRIPT_DIR/setup.sh" "$target" "${setup_args[@]}"

heading "Independent app foundation ready"
info "Review the working tree, add your own remote, then commit the verified baseline."
