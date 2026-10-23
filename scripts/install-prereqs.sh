#!/usr/bin/env bash
# Shell profile lines below are written literally (with $HOME unexpanded) on purpose.
# shellcheck disable=SC2016
# -----------------------------------------------------------------------------
# install-prereqs.sh - install the tools Mobile Starter App Builder needs
#
# Detects the operating system (Windows through Git Bash, macOS, Linux), the
# Linux distribution and the processor, checks which tools are already present
# at an acceptable version, prints a plan, asks once, then installs only what
# is missing. Installers used: winget on Windows; Homebrew plus the official
# Bun and rustup scripts on macOS; apt/dnf/pacman plus the official scripts on
# Linux. It finishes with the read-only doctor report.
#
# Usage
#   bash scripts/install-prereqs.sh [--platform expo|tauri|all] [--no-android]
#                                   [--yes] [--dry-run] [--help]
#
#   --platform    Which app platform to prepare for (default: all).
#   --no-android  Skip Android Studio, Java and the Android Rust targets.
#   --yes         Answer yes to the single confirmation (agents, CI).
#   --dry-run     Print the plan and exact commands; change nothing.
#
# After Android Studio is installed, run `bash start.sh android-setup` to
# install the SDK packages (platform, build tools, NDK, emulator) and create
# an emulator from the command line.
#
# Safety: commands that need administrator rights or sudo are listed first;
# shell profiles and Windows user variables are changed only after asking;
# running the script again skips everything already installed.
# -----------------------------------------------------------------------------
set -euo pipefail

ROOT="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
MIN_NODE="22.18.0"
MIN_BUN="1.3.0"
MIN_RUST="1.90.0"

PLATFORM="all"
ANDROID=1
ASSUME_YES=0
DRY_RUN=0
usage() { sed -n '/^# ----/,/^# ----/{/^# ----/d;s/^# \{0,1\}//;p;}' "${BASH_SOURCE[0]}"; }
while (($#)); do
  case "$1" in
    --platform) PLATFORM="${2:-}"; shift 2 ;;
    --platform=*) PLATFORM="${1#--platform=}"; shift ;;
    --no-android) ANDROID=0; shift ;;
    --yes | -y) ASSUME_YES=1; shift ;;
    --dry-run) DRY_RUN=1; shift ;;
    --help | -h) usage; exit 0 ;;
    *) echo "error: unknown argument '$1' (see --help)" >&2; exit 2 ;;
  esac
done
case "$PLATFORM" in expo | tauri | all) ;; *) echo "error: --platform must be expo, tauri or all" >&2; exit 2 ;; esac
want_expo() { [[ "$PLATFORM" != "tauri" ]]; }
want_tauri() { [[ "$PLATFORM" != "expo" ]]; }

say() { printf '%s\n' "$*"; }
have() { command -v "$1" >/dev/null 2>&1; }
extract_version() { grep -Eo '[0-9]+(\.[0-9]+)+' | head -n 1 || true; }
tool_version() { if have "$1"; then "$@" 2>/dev/null | extract_version; fi; }
version_ge() {
  local IFS=. i x y
  # shellcheck disable=SC2206
  local a=($1) b=($2)
  for i in 0 1 2; do
    x="${a[$i]:-0}"; y="${b[$i]:-0}"; x="${x%%[!0-9]*}"; y="${y%%[!0-9]*}"
    if ((10#${x:-0} > 10#${y:-0})); then return 0; fi
    if ((10#${x:-0} < 10#${y:-0})); then return 1; fi
  done
  return 0
}
confirm() {
  local reply
  if ((ASSUME_YES)); then say "$1 [y/N] y (--yes)"; return 0; fi
  [[ -t 0 ]] || { say "$1 [y/N] n (no terminal; re-run with --yes)"; return 1; }
  read -r -p "$1 [y/N] " reply
  [[ "$reply" =~ ^[Yy] ]]
}

case "$(uname -s)" in
  MINGW* | MSYS* | CYGWIN*) OS="windows" ;;
  Darwin) OS="macos" ;;
  Linux) OS="linux" ;;
  *) echo "error: unsupported operating system $(uname -s)" >&2; exit 1 ;;
esac
case "$(uname -m)" in x86_64 | amd64) ARCH="x64" ;; aarch64 | arm64) ARCH="arm64" ;; *) ARCH="$(uname -m)" ;; esac
PKG="none"
if [[ "$OS" == "linux" && -r /etc/os-release ]]; then
  # shellcheck disable=SC1091
  ids="$(. /etc/os-release && printf '%s %s' "${ID:-}" "${ID_LIKE:-}")"
  case " $ids " in *" debian "* | *" ubuntu "*) PKG="apt" ;; *" fedora "*) PKG="dnf" ;; *" arch "*) PKG="pacman" ;; esac
fi
SUDO=""
[[ "$OS" == "linux" && "$(id -u)" -ne 0 ]] && SUDO="sudo"
# Added even when missing, so a tool installed by a step below is found by the steps that follow it.
for dir in "$HOME/.bun/bin" "$HOME/.cargo/bin"; do PATH="$dir:$PATH"; done
if [[ "$OS" == "windows" ]]; then
  # Git Bash often starts without the folders that hold winget and PowerShell, so a machine that has
  # winget still looks like it has none. Add the usual locations for this run (nothing is saved).
  for dir in "${LOCALAPPDATA:+$(cygpath -u "$LOCALAPPDATA")/Microsoft/WindowsApps}" \
    "${LOCALAPPDATA:+$(cygpath -u "$LOCALAPPDATA")/Microsoft/WinGet/Links}" \
    "/c/Windows/System32/WindowsPowerShell/v1.0"; do
    [[ -n "$dir" && -d "$dir" ]] && PATH="$PATH:$dir"
  done
fi
export PATH

ROWS=()
STEPS=()
SHOWN=()
MANUAL=()
PROFILE=()
SYS_PKGS=()
row() { ROWS+=("$(printf '%-44s %-26s %s' "$1" "${2:--}" "$3")"); }
step() { SHOWN+=("$1"); STEPS+=("$2"); }
manual() { MANUAL+=("$1"); }
profile_line() { PROFILE+=("$1"); }

winget_step() {
  local label="$1" id="$2" override="${3:-}" cmd
  if ! have winget.exe; then
    manual "$label: winget (the Windows Package Manager, part of App Installer in the Microsoft Store) was not found, so this cannot be done automatically. Install the tool by hand (see the README's prerequisites table) or install App Installer, then run this script again."
    return
  fi
  cmd="winget install --id $id -e --source winget --accept-package-agreements --accept-source-agreements"
  if [[ -n "$override" ]]; then
    step "$label: $cmd --override \"$override\"" "winget.exe install --id $id -e --source winget --accept-package-agreements --accept-source-agreements --override $(printf '%q' "$override")"
  else
    step "$label: $cmd" "winget.exe $(printf '%s' "${cmd#winget }")"
  fi
}

pkg_installed() {
  case "$PKG" in
    apt) dpkg-query -W -f='${Status}' "$1" 2>/dev/null | grep -q "install ok installed" ;;
    dnf) rpm -q "$1" >/dev/null 2>&1 ;;
    pacman) pacman -Q "$1" >/dev/null 2>&1 ;;
    *) return 1 ;;
  esac
}
want_pkgs() {
  local label="$1" p missing=()
  shift
  for p in "$@"; do pkg_installed "$p" || missing+=("$p"); done
  if ((${#missing[@]} == 0)); then row "$label" "installed" "ok"; else row "$label" "missing ${#missing[@]}" "$PKG (sudo)"; SYS_PKGS+=("${missing[@]}"); fi
}

# --- Checks -------------------------------------------------------------------

check_git() {
  local v; v="$(tool_version git --version)"
  if [[ -n "$v" ]]; then row "Git" "$v" "ok"; return; fi
  case "$OS" in
    windows) row "Git" "-" "winget"; winget_step "Install Git" Git.Git ;;
    macos) row "Git" "-" "xcode-select"; step "Install Xcode Command Line Tools (includes Git)" "xcode-select --install"; manual "Finish the Xcode Command Line Tools dialog, then run this script again." ;;
    linux) row "Git" "-" "$PKG (sudo)"; SYS_PKGS+=(git) ;;
  esac
}

check_node() {
  local v; v="$(tool_version node --version)"
  if [[ -n "$v" ]] && version_ge "$v" "$MIN_NODE"; then row "Node.js >= $MIN_NODE" "$v" "ok"; return; fi
  case "$OS" in
    windows)
      if have nvm; then
        # nvm-windows owns the node on PATH; a second installer from winget would fight it, so leave the switch to the user.
        row "Node.js >= $MIN_NODE" "${v:--}" "manual (nvm-windows)"
        manual "Node.js is managed by nvm-windows. Run: nvm install $MIN_NODE   then: nvm use $MIN_NODE   (or a newer 22.x or 24.x LTS), then open a new Git Bash window. This script does not install Node.js over nvm."
      else
        row "Node.js >= $MIN_NODE" "${v:--}" "winget (LTS)"; winget_step "Install Node.js LTS" OpenJS.NodeJS.LTS
      fi
      ;;
    macos) row "Node.js >= $MIN_NODE" "${v:--}" "brew"; step "Install Node.js with Homebrew: brew install node" "brew install node" ;;
    linux) row "Node.js >= $MIN_NODE" "${v:--}" "manual"; manual "Install Node.js $MIN_NODE or newer from https://nodejs.org/en/download (the LTS release is fine)." ;;
  esac
}

check_bun() {
  local v; v="$(tool_version bun --version)"
  if [[ -n "$v" ]] && version_ge "$v" "$MIN_BUN"; then row "Bun >= $MIN_BUN" "$v" "ok"; return; fi
  if [[ -n "$v" ]]; then row "Bun >= $MIN_BUN" "$v" "bun upgrade"; step "Upgrade Bun: bun upgrade" "bun upgrade"; return; fi
  case "$OS" in
    windows)
      # Bun's own installer, so it does not depend on winget or on which Node.js version is active
      # (a Bun installed with `npm install -g` disappears when nvm switches Node.js versions).
      row "Bun >= $MIN_BUN" "-" "official script"
      step "Install Bun: powershell irm bun.sh/install.ps1 | iex" "powershell.exe -NoProfile -ExecutionPolicy Bypass -Command 'irm bun.sh/install.ps1 | iex'"
      ;;
    *)
      row "Bun >= $MIN_BUN" "-" "official script"
      step "Install Bun: curl -fsSL https://bun.com/install | SHELL=/bin/sh bash" "curl -fsSL https://bun.com/install | SHELL=/bin/sh bash"
      profile_line 'export BUN_INSTALL="$HOME/.bun"'
      profile_line 'export PATH="$BUN_INSTALL/bin:$PATH"'
      ;;
  esac
}

check_watchman() {
  [[ "$OS" == "macos" ]] || return 0
  if have watchman; then row "Watchman (Metro file watcher)" "$(tool_version watchman --version)" "ok"; else row "Watchman (Metro file watcher)" "-" "brew"; step "Install Watchman: brew install watchman" "brew install watchman"; fi
}

java17_home() {
  local candidate
  for candidate in "${JAVA_HOME:-}" /c/Program\ Files/Microsoft/jdk-17* /c/Program\ Files/Eclipse\ Adoptium/jdk-17* \
    /Library/Java/JavaVirtualMachines/*17*/Contents/Home /usr/lib/jvm/*17*; do
    [[ -n "$candidate" && -f "$candidate/release" ]] || continue
    grep -Eq 'JAVA_VERSION="17' "$candidate/release" && { printf '%s' "$candidate"; return 0; }
  done
  return 1
}

check_java17() {
  local home
  if home="$(java17_home)"; then row "Java 17 JDK (Expo Android builds)" "$home" "ok"; return; fi
  case "$OS" in
    windows)
      row "Java 17 JDK (Expo Android builds)" "-" "winget"
      winget_step "Install Microsoft Build of OpenJDK 17 (winget ID not verified by this builder; if it fails, install JDK 17 from https://learn.microsoft.com/en-us/java/openjdk/install)" Microsoft.OpenJDK.17
      ;;
    macos) row "Java 17 JDK (Expo Android builds)" "-" "brew"; step "Install OpenJDK 17: brew install --cask microsoft-openjdk@17" "brew install --cask microsoft-openjdk@17" ;;
    linux)
      case "$PKG" in
        apt) want_pkgs "Java 17 JDK (Expo Android builds)" openjdk-17-jdk ;;
        dnf) want_pkgs "Java 17 JDK (Expo Android builds)" java-17-openjdk-devel ;;
        *) row "Java 17 JDK" "-" "manual"; manual "Install a Java 17 JDK with your package manager." ;;
      esac
      ;;
  esac
}

check_android_studio() {
  case "$OS" in
    windows)
      if [[ -d "/c/Program Files/Android/Android Studio" ]]; then row "Android Studio" "installed" "ok"; else row "Android Studio" "-" "winget"; winget_step "Install Android Studio" Google.AndroidStudio; fi
      ;;
    macos)
      if [[ -d "/Applications/Android Studio.app" ]]; then row "Android Studio" "installed" "ok"; else row "Android Studio" "-" "brew cask"; step "Install Android Studio: brew install --cask android-studio" "brew install --cask android-studio"; fi
      ;;
    linux)
      if [[ -x /opt/android-studio/bin/studio.sh ]]; then row "Android Studio" "/opt/android-studio" "ok"; else row "Android Studio" "-" "manual"; manual "Download Android Studio for Linux from https://developer.android.com/studio and extract it to /opt/android-studio."; fi
      ;;
  esac
  manual "Open Android Studio once and finish its setup wizard, then run: bash start.sh android-setup   (installs SDK platform, build tools, NDK, emulator and creates an emulator)."
}

check_rust() {
  local v; v="$(tool_version rustc --version)"
  if [[ -n "$v" ]] && version_ge "$v" "$MIN_RUST"; then row "Rust >= $MIN_RUST (rustup)" "$v" "ok"; return; fi
  if [[ -n "$v" ]] && have rustup; then row "Rust >= $MIN_RUST (rustup)" "$v" "rustup update"; step "Update Rust: rustup update stable" "rustup update stable"; return; fi
  case "$OS" in
    windows)
      # rustup's official installer (needs the C++ build tools, checked above); -y accepts the defaults,
      # which on Windows is the MSVC toolchain.
      row "Rust >= $MIN_RUST (rustup)" "${v:--}" "official installer"
      step "Install Rust: download rustup-init.exe from static.rust-lang.org and run it with -y" \
        "curl -fsSL -o \"\${TEMP:-/tmp}/rustup-init.exe\" https://static.rust-lang.org/rustup/dist/x86_64-pc-windows-msvc/rustup-init.exe && \"\${TEMP:-/tmp}/rustup-init.exe\" -y --default-toolchain stable"
      ;;
    *)
      row "Rust >= $MIN_RUST (rustup)" "${v:--}" "official script"
      step "Install Rust: curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path" \
        "curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --no-modify-path"
      profile_line '. "$HOME/.cargo/env"'
      ;;
  esac
}

check_rust_targets() {
  local label="$1" t installed missing=()
  shift
  installed="$(rustup target list --installed 2>/dev/null || true)"
  for t in "$@"; do printf '%s\n' "$installed" | grep -qx "$t" || missing+=("$t"); done
  if ((${#missing[@]} == 0)); then row "$label" "installed" "ok"; else row "$label" "missing ${#missing[@]}" "rustup target add"; step "Add $label: rustup target add ${missing[*]}" "rustup target add ${missing[*]}"; fi
}

check_tauri_system() {
  case "$OS" in
    windows)
      local vswhere="/c/Program Files (x86)/Microsoft Visual Studio/Installer/vswhere.exe"
      if [[ -x "$vswhere" ]] && [[ -n "$("$vswhere" -latest -products '*' -requires Microsoft.VisualStudio.Component.VC.Tools.x86.x64 -property displayName 2>/dev/null)" ]]; then
        row "C++ Build Tools (Desktop development with C++)" "installed" "ok"
      else
        row "C++ Build Tools (Desktop development with C++)" "-" "winget (admin prompt)"
        winget_step "Install Visual Studio Build Tools with the C++ workload" Microsoft.VisualStudio.BuildTools \
          "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
      fi
      ;;
    macos) xcode-select -p >/dev/null 2>&1 && row "Xcode Command Line Tools" "installed" "ok" || { row "Xcode Command Line Tools" "-" "xcode-select"; step "Install Xcode Command Line Tools" "xcode-select --install"; } ;;
    linux)
      case "$PKG" in
        apt) want_pkgs "Tauri libraries (WebKitGTK 4.1)" libwebkit2gtk-4.1-dev build-essential curl wget file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev pkg-config ;;
        dnf) want_pkgs "Tauri libraries (WebKitGTK 4.1)" webkit2gtk4.1-devel openssl-devel curl wget file libappindicator-gtk3-devel librsvg2-devel libxdo-devel ;;
        pacman) want_pkgs "Tauri libraries (WebKitGTK 4.1)" webkit2gtk-4.1 base-devel curl wget file openssl appmenu-gtk-module libappindicator-gtk3 librsvg xdotool ;;
        *) row "Tauri system libraries" "-" "manual"; manual "Install the Tauri Linux prerequisites listed in _tauri2/docs/reference/01-prerequisites.md." ;;
      esac
      ;;
  esac
}

check_ios() {
  [[ "$OS" == "macos" ]] || return 0
  if xcodebuild -version >/dev/null 2>&1; then row "Xcode (full, for iOS)" "$(xcodebuild -version | head -n 1)" "ok"; else row "Xcode (full, for iOS)" "-" "manual"; manual "Install Xcode from the Mac App Store and open it once."; fi
  if have pod; then row "CocoaPods" "$(tool_version pod --version)" "ok"; else row "CocoaPods" "-" "brew"; step "Install CocoaPods: brew install cocoapods" "brew install cocoapods"; fi
}

# --- Plan ---------------------------------------------------------------------

check_git
check_node
check_bun
if want_expo; then check_watchman; fi
if ((ANDROID)); then
  if want_expo; then check_java17; fi
  check_android_studio
fi
if want_tauri; then
  check_tauri_system
  check_rust
  if have rustup; then
    if ((ANDROID)); then check_rust_targets "Rust Android targets" aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android; fi
    if [[ "$OS" == "macos" ]]; then check_rust_targets "Rust iOS targets" aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim; fi
  else
    manual "The Android/iOS Rust targets are added automatically right after rustup is installed."
  fi
fi
check_ios

if ((${#SYS_PKGS[@]})); then
  case "$PKG" in
    apt) STEPS=("$SUDO apt-get update && $SUDO apt-get install -y ${SYS_PKGS[*]}" ${STEPS[@]+"${STEPS[@]}"}) ;;
    dnf) STEPS=("$SUDO dnf install -y ${SYS_PKGS[*]}" ${STEPS[@]+"${STEPS[@]}"}) ;;
    pacman) STEPS=("$SUDO pacman -Syu --needed --noconfirm ${SYS_PKGS[*]}" ${STEPS[@]+"${STEPS[@]}"}) ;;
  esac
  SHOWN=("System packages (uses sudo): ${STEPS[0]}" ${SHOWN[@]+"${SHOWN[@]}"})
fi
if [[ "$OS" == "macos" ]] && ! have brew && printf '%s\n' ${STEPS[@]+"${STEPS[@]}"} | grep -q '^brew '; then
  manual "Homebrew is required for the brew steps: install it from https://brew.sh, then run this script again."
fi

say ""
say "Mobile Starter App Builder - machine preparation"
say "Host: $OS ($ARCH)$([[ "$OS" == linux ]] && printf ', package manager: %s' "$PKG")   Platform: $PLATFORM   Android: $([[ $ANDROID == 1 ]] && echo yes || echo no)"
say ""
printf '%-44s %-26s %s\n' "TOOL" "FOUND" "ACTION"
printf '%s\n' "${ROWS[@]}"
say ""
if ((${#SHOWN[@]})); then
  say "Commands that will run, in order:"
  for i in "${!SHOWN[@]}"; do say "  $((i + 1)). ${SHOWN[$i]}"; done
  say ""
fi

finish() {
  if ((${#MANUAL[@]})); then
    say ""
    say "Manual steps:"
    for m in "${MANUAL[@]}"; do say "  - $m"; done
  fi
}

if ((DRY_RUN)); then
  ((${#PROFILE[@]})) && { say "Shell profile lines that would be offered:"; printf '  %s\n' "${PROFILE[@]}"; }
  finish
  say ""
  say "Dry run: nothing was changed."
  exit 0
fi

if ((${#STEPS[@]})); then
  if confirm "Run the steps above?"; then
    for i in "${!STEPS[@]}"; do
      say ""
      say "==> ${SHOWN[$i]}"
      bash -c "${STEPS[$i]}" || say "warning: step $((i + 1)) did not finish; see the output above."
    done
    # rustup only exists after its step above, so its targets are added here rather than asking for a second run.
    if want_tauri && have rustup; then
      targets=()
      ((ANDROID)) && targets+=(aarch64-linux-android armv7-linux-androideabi i686-linux-android x86_64-linux-android)
      [[ "$OS" == "macos" ]] && targets+=(aarch64-apple-ios x86_64-apple-ios aarch64-apple-ios-sim)
      if ((${#targets[@]})); then
        say ""
        say "==> Add Rust targets: ${targets[*]}"
        rustup target add "${targets[@]}" || say "warning: adding Rust targets did not finish; run: rustup target add ${targets[*]}"
      fi
    fi
  else
    say "Nothing was installed."
  fi
else
  say "Nothing to install."
fi

if ((${#PROFILE[@]})) && [[ "$OS" != "windows" ]]; then
  case "$(basename "${SHELL:-sh}")" in zsh) rc="$HOME/.zshrc" ;; bash) rc="$HOME/.bashrc"; [[ "$OS" == macos ]] && rc="$HOME/.bash_profile" ;; *) rc="$HOME/.profile" ;; esac
  new=()
  for l in "${PROFILE[@]}"; do [[ -f "$rc" ]] && grep -Fqx -- "$l" "$rc" || new+=("$l"); done
  if ((${#new[@]})); then
    say ""
    printf '  %s\n' "${new[@]}"
    if confirm "Append these PATH lines to $rc so new terminals find the tools?"; then
      { printf '\n# Added by Mobile Starter App Builder\n'; printf '%s\n' "${new[@]}"; } >>"$rc"
    fi
  fi
fi
if [[ "$OS" == "windows" ]] && ((${#STEPS[@]})); then
  say ""
  say "Windows: close and reopen Git Bash (and VS Code) so newly installed tools are on PATH."
fi

finish
say ""
node "$ROOT/scripts/doctor.mjs" --platform "$PLATFORM" 2>/dev/null || say "Run 'bash start.sh doctor' in a new terminal to re-check."
