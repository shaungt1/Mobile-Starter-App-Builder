#!/usr/bin/env bash
# Shared Android implementation for start-emulator.sh and start-usb.sh.
# Sourced after lib/common.sh, never executed directly.
#
# Lessons carried over from the first production use of this template:
#   * Find the Android SDK and a Java 17 JDK even when ANDROID_HOME/JAVA_HOME are
#     unset or point at the wrong JDK (Windows Git Bash paths are converted).
#   * Restart a stuck ADB server once instead of failing on its first protocol error.
#   * Start and wait for an AVD directly; Expo's AVD-name probe fails on newer
#     embedded emulators that do not expose the legacy console port.
#   * Build only the connected device's CPU architecture, with a larger Gradle
#     heap, because the default 2 GB heap runs out during D8 packaging.
#   * On Windows, map the app folder to a short drive letter during the native
#     build so CMake object paths stay under the 260-character limit
#     (paired with plugins/with-android-cmake-path-limit.js).
#   * Verify the install, map Metro's port with `adb reverse`, and open the
#     development client on the dev server instead of assuming it connected.

configure_android_toolchain() {
  local sdk_unix="" java_unix="" candidate=""

  for candidate in "${ANDROID_HOME:-}" "${ANDROID_SDK_ROOT:-}" \
    "${LOCALAPPDATA:+${LOCALAPPDATA}\\Android\\Sdk}" "$HOME/Library/Android/sdk" "$HOME/Android/Sdk"; do
    [[ -n "$candidate" ]] || continue
    if command -v cygpath >/dev/null 2>&1; then candidate="$(cygpath -u "$candidate")"; fi
    if [[ -x "$candidate/platform-tools/adb.exe" || -x "$candidate/platform-tools/adb" ]]; then
      sdk_unix="$candidate"
      break
    fi
  done
  [[ -n "$sdk_unix" ]] || fail "Android SDK not found. Run 'bash scripts/android-setup.sh' from the builder, or install it with Android Studio."

  is_java17() { [[ -f "$1/release" ]] && grep -Eq 'JAVA_VERSION="17([._]|")' "$1/release"; }
  for candidate in "${JAVA_HOME:-}" /c/Program\ Files/Eclipse\ Adoptium/jdk-17* /c/Program\ Files/Microsoft/jdk-17* \
    /Library/Java/JavaVirtualMachines/temurin-17*/Contents/Home /usr/lib/jvm/temurin-17* /usr/lib/jvm/java-17*; do
    [[ -n "$candidate" ]] || continue
    if command -v cygpath >/dev/null 2>&1; then candidate="$(cygpath -u "$candidate")"; fi
    if is_java17 "$candidate"; then
      java_unix="$candidate"
      break
    fi
  done
  [[ -n "$java_unix" ]] || fail "A Java 17 JDK was not found. Install Temurin 17 (the builder's install-prereqs script can do this)."

  if command -v cygpath >/dev/null 2>&1; then
    ANDROID_HOME="$(cygpath -w "$sdk_unix")"
    JAVA_HOME="$(cygpath -w "$java_unix")"
    export ANDROID_HOME JAVA_HOME
  else
    export ANDROID_HOME="$sdk_unix"
    export JAVA_HOME="$java_unix"
  fi
  export ANDROID_SDK_ROOT="$ANDROID_HOME"
  export PATH="$java_unix/bin:$sdk_unix/platform-tools:$sdk_unix/emulator:$PATH"

  if ! adb start-server >/dev/null 2>&1; then
    info "ADB did not answer cleanly; restarting the local ADB server once."
    adb kill-server >/dev/null 2>&1 || true
    sleep 1
    adb start-server >/dev/null || fail "ADB could not start after an automatic restart."
  fi
}

# Prints the serial of a connected target. mode is "emulator" or "usb".
select_android_serial() {
  local mode="$1" serial="" selection=""
  local -a devices=()
  while read -r serial; do
    [[ -z "$serial" ]] && continue
    case "$mode" in
      emulator) [[ "$serial" == emulator-* ]] && devices+=("$serial") ;;
      usb) [[ "$serial" != emulator-* && "$serial" != 127.0.0.1:* ]] && devices+=("$serial") ;;
    esac
  done < <(adb devices | awk 'NR > 1 && $2 == "device" { print $1 }')

  ((${#devices[@]} > 0)) || return 1
  if ((${#devices[@]} == 1)); then
    printf '%s\n' "${devices[0]}"
    return 0
  fi
  info "Available Android targets:" >&2
  for selection in "${!devices[@]}"; do printf '  %d) %s\n' "$((selection + 1))" "${devices[$selection]}" >&2; done
  read -r -p "Choose a target: " selection
  if ! [[ "$selection" =~ ^[0-9]+$ ]] || ((selection < 1 || selection > ${#devices[@]})); then
    fail "Invalid target selection."
  fi
  printf '%s\n' "${devices[$((selection - 1))]}"
}

# Waits until the target reports "device" and Android has finished booting (up to four minutes).
wait_for_android_boot() {
  local serial="$1" deadline=$((SECONDS + 240))
  while ((SECONDS < deadline)); do
    if [[ "$(adb -s "$serial" get-state 2>/dev/null | tr -d '\r')" == "device" ]] &&
      [[ "$(adb -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]]; then
      return 0
    fi
    sleep 2
  done
  return 1
}

# Restarts the local ADB server and waits for the target to come back online. A second ADB server of another
# version (another tool's, or Gradle's own client) makes the running one exit and leaves emulators "offline".
restart_adb_for_target() {
  local serial="$1"
  adb kill-server >/dev/null 2>&1 || true
  sleep 2
  adb start-server >/dev/null 2>&1 || fail "ADB could not start after an automatic restart."
  wait_for_android_boot "$serial" || fail "$serial did not come back online after restarting ADB. Close other tools that use ADB (Android Studio device mirroring, phone-mirroring apps, other emulators) and run the command again."
}

# Boots an Android Virtual Device (asks which one when several exist) and waits for Android to finish starting.
start_android_avd() {
  local avd="${APP_AVD:-}" selection="" deadline=0 log_file
  local -a avds=()
  mapfile -t avds < <(emulator -list-avds | sed '/^[[:space:]]*$/d')
  ((${#avds[@]} > 0)) || fail "No Android Virtual Device exists. Create one with the builder's 'bash scripts/android-setup.sh --create-avd' or Android Studio's Device Manager."

  if [[ -z "$avd" ]]; then
    if ((${#avds[@]} == 1)); then
      avd="${avds[0]}"
    else
      info "Available Android Virtual Devices:"
      for selection in "${!avds[@]}"; do printf '  %d) %s\n' "$((selection + 1))" "${avds[$selection]}"; done
      read -r -p "Choose an emulator: " selection
      if ! [[ "$selection" =~ ^[0-9]+$ ]] || ((selection < 1 || selection > ${#avds[@]})); then
        fail "Invalid emulator selection."
      fi
      avd="${avds[$((selection - 1))]}"
    fi
  fi

  log_file="${TMPDIR:-/tmp}/app-android-emulator.log"
  heading "Starting Android emulator: $avd"
  emulator -avd "$avd" >"$log_file" 2>&1 &
  adb wait-for-device
  deadline=$((SECONDS + 240))
  while ((SECONDS < deadline)); do
    [[ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" == "1" ]] && return 0
    sleep 2
  done
  fail "The Android emulator did not finish booting within four minutes (log: $log_file)."
}

# Windows only: maps the app folder to a short drive letter so CMake object paths fit in 260 characters.
activate_short_windows_project_path() {
  local drive="${APP_SUBST_DRIVE:-}" drive_letter source_root_win subst_output candidate
  [[ "$(uname -s)" == MINGW* || "$(uname -s)" == MSYS* ]] || return 0
  if [[ -z "$drive" ]]; then
    # Pick the first letter no volume, network share or earlier mapping uses (M: is often a mapped network drive).
    for candidate in M R S T U V W X Y Z; do
      if [[ ! -e "/${candidate,,}" ]]; then drive="${candidate}:"; break; fi
    done
    [[ -n "$drive" ]] || fail "No free drive letter found for the temporary Android build mapping. Set APP_SUBST_DRIVE to an unused letter such as Q:."
  fi
  [[ "$drive" =~ ^[A-Za-z]:$ ]] || fail "APP_SUBST_DRIVE must look like M:."
  drive="${drive^^}"
  drive_letter="${drive:0:1}"
  source_root_win="$(cygpath -w "$APP_ROOT")"

  subst_output="$(subst.exe 2>/dev/null | tr -d '\r')"
  if printf '%s\n' "$subst_output" | grep -Eiq "^${drive_letter}:\\\\:"; then
    fail "$drive is already assigned. Set APP_SUBST_DRIVE to another unused drive letter."
  fi
  MSYS2_ARG_CONV_EXCL='*' subst.exe "$drive" "$source_root_win" >/dev/null ||
    fail "Could not create the temporary $drive mapping for the Android native build."

  export APP_SUBST_DRIVE="$drive"
  export APP_ANDROID_SHORT_APP_ROOT="$drive"
  export APP_ANDROID_CXX_DIR="${APP_ANDROID_CXX_DIR:-${SYSTEMDRIVE:-C:}/app-cxx}"
  # shellcheck disable=SC2329 # invoked by the trap below
  cleanup_app_subst() { MSYS2_ARG_CONV_EXCL='*' subst.exe "${APP_SUBST_DRIVE}" /D >/dev/null 2>&1 || true; }
  trap cleanup_app_subst EXIT INT TERM
  info "Using temporary short CMake source path $APP_ANDROID_SHORT_APP_ROOT."
}

# Builds the debug app for the target's CPU, installs it, verifies it, maps Metro and opens it.
install_and_run_android_target() {
  local serial="$1" target_abi="" package="" slug="" gradle_heap_mb="${APP_GRADLE_HEAP_MB:-6144}"
  package="$(app_json_value expo.android.package)" || fail "app.json has no expo.android.package."
  # expo-dev-client registers the URL scheme exp+<slug> to open a dev server.
  slug="$(app_json_value expo.slug)" || fail "app.json has no expo.slug."

  export ANDROID_SERIAL="$serial"
  export NODE_ENV=development
  cd "$APP_ROOT" || fail "Cannot enter $APP_ROOT."
  if [[ ! -x android/gradlew && ! -f android/gradlew ]]; then
    heading "Generating the Android development project (expo prebuild)"
    bunx expo prebuild --platform android
  fi

  activate_short_windows_project_path
  cd "$APP_ROOT" || fail "Cannot enter $APP_ROOT."

  target_abi="$(adb -s "$serial" shell getprop ro.product.cpu.abi 2>/dev/null | tr -d '\r')"
  [[ -n "$target_abi" ]] || fail "Could not determine the CPU architecture for $serial."
  [[ "$gradle_heap_mb" =~ ^[0-9]+$ ]] || fail "APP_GRADLE_HEAP_MB must be a whole number of megabytes."

  heading "Building and installing $package on $serial ($target_abi)"
  run_gradle_install() {
    (cd "$APP_ROOT/android" && ./gradlew \
      -Dorg.gradle.jvmargs="-Xmx${gradle_heap_mb}m -XX:MaxMetaspaceSize=1024m -Dfile.encoding=UTF-8" \
      --max-workers=4 \
      app:installDebug \
      -PreactNativeDevServerPort=8081 \
      -PreactNativeArchitectures="$target_abi" \
      --console=plain)
  }
  if ! run_gradle_install; then
    # The compile is cached, so a retry is quick. The usual cause is an ADB server mismatch or reset during the install.
    info "The build or install failed. Restarting ADB and trying once more (compiled output is reused)."
    restart_adb_for_target "$serial"
    run_gradle_install || fail "Gradle failed again. Read the first error above; docs/LESSONS_LEARNED.md in the builder repository lists known causes."
  fi

  adb -s "$serial" shell pm path "$package" >/dev/null || fail "Gradle finished but $package is not installed on $serial."
  info "Verified that $package is installed on $serial."
  adb -s "$serial" reverse tcp:8081 tcp:8081
  adb -s "$serial" reverse --list | grep -F 'tcp:8081 tcp:8081' >/dev/null || fail "Metro port mapping was not created."
  info "Verified Metro port mapping on $serial."
  (
    sleep 5
    adb -s "$serial" shell am start -a android.intent.action.VIEW \
      -d "exp+${slug}://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081" "$package" >/dev/null 2>&1 || true
  ) &

  heading "Starting Metro"
  bunx expo start --dev-client --localhost
}
