#!/usr/bin/env bash
# Finds and exports JAVA_HOME, ANDROID_HOME and NDK_HOME for `tauri android ...`,
# so the commands work in a new Git Bash, macOS or Linux terminal even when the
# variables were never set. Sourced after lib/common.sh.
#
# Order of preference follows the Tauri prerequisites: Android Studio's bundled
# JDK ("jbr") first, then a Java 17 JDK. The newest installed NDK is used.

to_unix() { if command -v cygpath >/dev/null 2>&1; then cygpath -u "$1"; else printf '%s' "$1"; fi; }
to_native() { if command -v cygpath >/dev/null 2>&1; then cygpath -w "$1"; else printf '%s' "$1"; fi; }

configure_android_env() {
  local sdk="" jdk="" ndk="" candidate=""
  for candidate in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" "${LOCALAPPDATA:+${LOCALAPPDATA}\\Android\\Sdk}" \
    "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
    [[ -n "$candidate" ]] || continue
    candidate="$(to_unix "$candidate")"
    if [[ -d "$candidate/platform-tools" ]]; then sdk="$candidate"; break; fi
  done
  [[ -n "$sdk" ]] || fail "Android SDK not found. Run the builder's 'bash start.sh android-setup' or install it in Android Studio's SDK Manager."

  for candidate in "${JAVA_HOME:-}" "/c/Program Files/Android/Android Studio/jbr" \
    "/Applications/Android Studio.app/Contents/jbr/Contents/Home" "/opt/android-studio/jbr" \
    /c/Program\ Files/Eclipse\ Adoptium/jdk-17* /Library/Java/JavaVirtualMachines/temurin-17*/Contents/Home /usr/lib/jvm/*17*; do
    [[ -n "$candidate" ]] || continue
    candidate="$(to_unix "$candidate")"
    if [[ -x "$candidate/bin/java" || -x "$candidate/bin/java.exe" ]]; then jdk="$candidate"; break; fi
  done
  [[ -n "$jdk" ]] || fail "No JDK found. Install Android Studio (it bundles one) or Temurin 17."

  if [[ -n "${NDK_HOME:-}" && -d "$(to_unix "$NDK_HOME")" ]]; then
    ndk="$(to_unix "$NDK_HOME")"
  elif [[ -d "$sdk/ndk" ]]; then
    # shellcheck disable=SC2012 # NDK folder names are plain version numbers
    candidate="$(ls -1 "$sdk/ndk" 2>/dev/null | sort -V | tail -n 1)"
    [[ -n "$candidate" ]] && ndk="$sdk/ndk/$candidate"
  fi
  [[ -n "$ndk" ]] || fail "Android NDK not found. Install 'NDK (Side by side)' in Android Studio's SDK Manager or run the builder's android-setup."

  ANDROID_HOME="$(to_native "$sdk")"
  JAVA_HOME="$(to_native "$jdk")"
  NDK_HOME="$(to_native "$ndk")"
  export ANDROID_HOME JAVA_HOME NDK_HOME
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
  export PATH="$jdk/bin:$sdk/platform-tools:$sdk/emulator:$PATH"
  info "JAVA_HOME=$JAVA_HOME"
  info "ANDROID_HOME=$ANDROID_HOME"
  info "NDK_HOME=$NDK_HOME"
}
