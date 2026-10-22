#!/usr/bin/env bash
# -----------------------------------------------------------------------------
# android-setup.sh - install Android SDK packages and create an emulator from
# the command line (after Android Studio and its setup wizard are installed).
#
# Usage
#   bash scripts/android-setup.sh [--api 35] [--build-tools 36.0.0] [--no-avd]
#                                 [--avd-name NAME] [--set-env] [--yes] [--dry-run]
#
# Installs with sdkmanager: platform-tools, emulator, "platforms;android-<api>",
# "build-tools;<version>", the newest stable NDK (Tauri compiles Rust with it;
# Expo/React Native also downloads its own pinned NDK on first build), and a
# Google APIs system image for this processor. Accepts the SDK licenses after
# asking, then creates an Android Virtual Device (AVD) on a Pixel profile.
# API 35 and build-tools 36.0.0 follow the React Native environment guide.
#
# --set-env writes ANDROID_HOME and NDK_HOME as Windows user variables (or
# prints the export lines for your shell profile on macOS/Linux).
#
# Requires the "Android SDK Command-line Tools (latest)" package. If it is
# missing, install it once in Android Studio > SDK Manager > SDK Tools.
# -----------------------------------------------------------------------------
set -euo pipefail

API=35
BUILD_TOOLS="36.0.0"
CREATE_AVD=1
AVD_NAME=""
SET_ENV=0
ASSUME_YES=0
DRY_RUN=0
while (($#)); do
  case "$1" in
    --api) API="$2"; shift 2 ;;
    --build-tools) BUILD_TOOLS="$2"; shift 2 ;;
    --no-avd) CREATE_AVD=0; shift ;;
    --avd-name) AVD_NAME="$2"; shift 2 ;;
    --set-env) SET_ENV=1; shift ;;
    --yes | -y) ASSUME_YES=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --help | -h) sed -n '/^# ----/,/^# ----/{/^# ----/d;s/^# \{0,1\}//;p;}' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "error: unknown argument '$1'" >&2; exit 2 ;;
  esac
done
AVD_NAME="${AVD_NAME:-Mobile_Starter_API_${API}}"

say() { printf '%s\n' "$*"; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }
confirm() {
  local reply
  if ((ASSUME_YES)); then return 0; fi
  [[ -t 0 ]] || fail "$1 Re-run interactively or pass --yes."
  read -r -p "$1 [y/N] " reply
  [[ "$reply" =~ ^[Yy] ]]
}
to_unix() { if command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s' "$1"; fi; }
windows=0
case "$(uname -s)" in MINGW* | MSYS* | CYGWIN*) windows=1 ;; esac
ext=""; ((windows)) && ext=".bat"

sdk=""
for candidate in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "${LOCALAPPDATA:+${LOCALAPPDATA}\\Android\\Sdk}" "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
  [[ -n "$candidate" ]] || continue
  candidate="$(to_unix "$candidate")"
  [[ -d "$candidate" ]] && { sdk="$candidate"; break; }
done
[[ -n "$sdk" ]] || fail "No Android SDK folder found. Install Android Studio and finish its setup wizard first (bash start.sh install-prereqs)."
sdkmanager="$sdk/cmdline-tools/latest/bin/sdkmanager$ext"
avdmanager="$sdk/cmdline-tools/latest/bin/avdmanager$ext"
[[ -f "$sdkmanager" ]] || fail "sdkmanager not found at $sdkmanager. In Android Studio open SDK Manager > SDK Tools, tick 'Android SDK Command-line Tools (latest)', apply, then run this again."

# sdkmanager is a Java program; prefer Android Studio's bundled JDK when JAVA_HOME is unset.
if [[ -z "${JAVA_HOME:-}" ]]; then
  for jbr in "/c/Program Files/Android/Android Studio/jbr" "/Applications/Android Studio.app/Contents/jbr/Contents/Home" "/opt/android-studio/jbr"; do
    [[ -d "$jbr" ]] && { JAVA_HOME="$jbr"; ((windows)) && JAVA_HOME="$(cygpath -w "$jbr")"; export JAVA_HOME; break; }
  done
fi

case "$(uname -m)" in aarch64 | arm64) abi="arm64-v8a" ;; *) abi="x86_64" ;; esac
image="system-images;android-${API};google_apis;${abi}"

say "Android SDK: $sdk"
say "Reading the package list (this can take a minute)..."
listing="$("$sdkmanager" --list 2>/dev/null | tr -d '\r' || true)"
ndk="$(printf '%s\n' "$listing" | grep -Eo 'ndk;[0-9]+\.[0-9]+\.[0-9]+' | sort -t';' -k2 -V | uniq | tail -n 1 || true)"
[[ -n "$ndk" ]] || ndk="ndk-bundle"
packages=("platform-tools" "emulator" "platforms;android-${API}" "build-tools;${BUILD_TOOLS}" "$ndk")
((CREATE_AVD)) && packages+=("$image")

say ""
say "Packages to install or update:"
printf '  %s\n' "${packages[@]}"
((CREATE_AVD)) && say "Emulator to create: $AVD_NAME ($image, Pixel profile)"
if ((DRY_RUN)); then say ""; say "Dry run: nothing was changed."; exit 0; fi
confirm "Install these packages and accept the Android SDK licenses?" || { say "Nothing was changed."; exit 0; }

yes | "$sdkmanager" --licenses >/dev/null || true
"$sdkmanager" --install "${packages[@]}"

if ((CREATE_AVD)); then
  if "$sdk/emulator/emulator$( ((windows)) && echo .exe)" -list-avds 2>/dev/null | tr -d '\r' | grep -qx "$AVD_NAME"; then
    say "Emulator $AVD_NAME already exists."
  else
    device="$("$avdmanager" list device -c 2>/dev/null | tr -d '\r' | grep -E '^pixel_[0-9]+$' | sort -V | tail -n 1 || true)"
    echo no | "$avdmanager" create avd -n "$AVD_NAME" -k "$image" ${device:+-d "$device"}
    say "Created emulator $AVD_NAME${device:+ ($device)}."
  fi
fi

ndk_dir="$sdk/ndk/$(ls -1 "$sdk/ndk" 2>/dev/null | sort -V | tail -n 1)"
if ((SET_ENV)); then
  if ((windows)); then
    confirm "Set ANDROID_HOME and NDK_HOME as Windows user environment variables?" && \
      powershell.exe -NoProfile -Command "[Environment]::SetEnvironmentVariable('ANDROID_HOME','$(cygpath -w "$sdk")','User'); [Environment]::SetEnvironmentVariable('NDK_HOME','$(cygpath -w "$ndk_dir")','User')" && \
      say "Saved. Open a new Git Bash / VS Code window to pick them up."
  else
    say "Add these lines to your shell profile:"
    say "  export ANDROID_HOME=\"$sdk\""
    say "  export NDK_HOME=\"$ndk_dir\""
    say "  export PATH=\"\$ANDROID_HOME/platform-tools:\$ANDROID_HOME/emulator:\$PATH\""
  fi
else
  say "The app launch scripts find the SDK automatically. Pass --set-env to save ANDROID_HOME and NDK_HOME permanently."
fi
say ""
say "Android setup complete. Check with: bash start.sh doctor"
