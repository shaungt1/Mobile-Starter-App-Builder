#!/usr/bin/env bash
set -Eeuo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/common.sh"

usage() {
  cat <<'EOF'
Usage:
  release.sh TARGET build development|preview|production android|ios|all [--yes] [--skip-checks]
  release.sh TARGET update preview|production MESSAGE [--yes] [--skip-checks]
  release.sh TARGET submit android|ios|all [--yes]
  release.sh TARGET web preview|production [--yes] [--skip-checks]
EOF
}

(($# >= 2)) || { usage; exit 1; }
target="$1"
command="$2"
shift 2
SKIP_CHECKS=0
POSITIONAL=()
while (($#)); do
  case "$1" in
    --skip-checks) SKIP_CHECKS=1 ;;
    --yes) STARTER_YES=1 ;;
    *) POSITIONAL+=("$1") ;;
  esac
  shift
done
set -- "${POSITIONAL[@]}"

require_app "$target"
require_bun
[[ -d "$APP_ROOT/node_modules" ]] || fail "Dependencies are missing. Run setup first."
cd "$APP_ROOT"

validate_platform() { case "$1" in android|ios|all) ;; *) fail "Platform must be android, ios, or all." ;; esac; }
release_checks() {
  if ((SKIP_CHECKS)); then info "Release checks skipped by request."; else bash "$SCRIPT_DIR/verify.sh" "$APP_ROOT"; fi
}

case "$command" in
  build)
    (($# == 2)) || { usage; exit 1; }
    profile="$1"; platform="$2"
    case "$profile" in development|development-device|preview|production) ;; *) fail "Unknown build profile: $profile" ;; esac
    validate_platform "$platform"
    release_checks
    ensure_eas_ready
    heading "EAS cloud build: $profile / $platform"
    confirm "Queue this cloud build?" || fail "Build canceled."
    "${EAS_CMD[@]}" build --profile "$profile" --platform "$platform"
    ;;
  update)
    (($# == 2)) || { usage; exit 1; }
    channel="$1"; message="$2"
    case "$channel" in preview|production) ;; *) fail "Channel must be preview or production." ;; esac
    [[ -n "$message" ]] || fail "An update message is required."
    release_checks
    ensure_eas_ready
    heading "EAS Update: $channel"
    info "Use OTA only for JavaScript/assets compatible with the installed native runtime."
    confirm "Publish this over-the-air update?" || fail "Update canceled."
    "${EAS_CMD[@]}" update --channel "$channel" --environment "$channel" --message "$message"
    ;;
  submit)
    (($# == 1)) || { usage; exit 1; }
    validate_platform "$1"
    ensure_eas_ready
    heading "Store submission: latest production build / $1"
    confirm "Submit the latest production build?" || fail "Submission canceled."
    "${EAS_CMD[@]}" submit --profile production --platform "$1" --latest
    ;;
  web)
    (($# == 1)) || { usage; exit 1; }
    case "$1" in preview) web_args=() ;; production) web_args=(--prod) ;; *) fail "Web target must be preview or production." ;; esac
    release_checks
    ensure_eas_ready
    heading "EAS Hosting deployment: $1"
    confirm "Export and deploy the web app?" || fail "Deployment canceled."
    bunx expo export --platform web
    "${EAS_CMD[@]}" deploy "${web_args[@]}"
    ;;
  *) usage; fail "Unknown release command: $command" ;;
esac
