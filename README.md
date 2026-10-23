# Mobile Starter App Builder

Mobile Starter App Builder is a reusable generator for Android and iOS applications. It holds two
complete, tested app platforms, scripts that prepare a developer's machine (including Android emulators),
and instructions written for both people and AI coding agents. Pointed at an empty folder or at a newly
created GitHub repository, it copies in a working app with its interface kit, gestures, animation,
theming, scripts, documentation and agent rules, then installs, sets up and verifies it. The builder
itself is never copied into the app and never changes, so the same checkout produces any number of apps.

## The two platforms

Each platform lives in its own top-level folder and can be used on its own. The table below summarizes
what each produces; `_tauri2/README.md` compares them in more detail.

| Folder | Platform | Interface | What a new app starts with |
| --- | --- | --- | --- |
| [`_expo/`](_expo/README.md) | Expo (React Native) | NativeWind + React Native Reusables, the shadcn/ui component API for React Native | Owned, pinned template derived from the MIT-licensed Simonstorms expo-app-template: Expo Router, auth (Supabase), paywall (RevenueCat), analytics (PostHog), notifications, local SQLite + Drizzle, EAS profiles, Android/iOS launch scripts. Each built-in feature can be switched off, removed or added back, and the upstream onboarding funnel can be added (`_expo/docs/FEATURES.md`). A second path creates a clean app on the newest Expo SDK with the same UI foundation. |
| [`_tauri2/`](_tauri2/README.md) | Tauri 2 (Rust core + web view) | React with Vite (default) or Next.js, Tailwind CSS 4, shadcn/ui; Konsta UI (iOS/Material look) as an alternative; Consta UIKit as an add-on | Phone-first shell, three starter screens, typed Rust commands, deny-by-default permissions, mobile plugin catalog (haptics, barcode scanner, biometrics, location, NFC, notifications, SQLite, HTTP, and more). |

Both platforms read the same project plan format (name, slug, scheme, bundle ID, theme colors as HSL
values, capabilities, screens), so one plan describes an app on either platform. Expo plans can also
list template features to switch off, remove or add.

## Quick start (Windows Git Bash, macOS or Linux)

The four steps below take a machine from nothing to a running app. Every command can be run by a person
or by an agent; anything that installs software shows its plan and asks once (`--yes` skips the question).

```bash
# 1. Check the machine, then install whatever is missing
bash start.sh doctor
bash start.sh install-prereqs            # add --platform expo|tauri to limit it, --dry-run to only look
bash start.sh android-setup              # after Android Studio's first launch: SDK, NDK, emulator

# 2. Create an app (asks for anything not given)
bash start.sh new
#    or fully specified, into a new empty GitHub repository, committed and pushed:
bash start.sh new --platform expo --repo https://github.com/<org>/<app>.git \
  --name "Field Notes" --bundle-id com.example.fieldnotes --install --commit --push --yes

# 3. Work inside the new app (it is a separate project from now on)
cd ../<app> && bash start.sh            # menu: run on web, Android emulator, USB phone, iOS, ...
```

`QUICKSTART.md` explains each step and the manual equivalents. With an agent, open this repository and
paste a prompt from [`prompts/`](prompts/), or ask: "Read AGENT_START.md, then build a new Tauri app in
<repository URL>". The agent follows [`AGENT_START.md`](AGENT_START.md) and the skills in
[`.claude/skills/`](.claude/skills/).

## What a developer needs on the machine

A developer who has none of the tools can still start: run `bash start.sh doctor` to see what is missing, then
`bash start.sh install-prereqs` to install it (it shows its plan and asks once; `--dry-run` only shows the
plan). The table below lists what each platform needs. "Installed by the script" means
`install-prereqs` installs it; the Android SDK packages and the emulator come from `android-setup` after
Android Studio's first launch.

| Need | Expo | Tauri 2 | Installed by the script |
| --- | --- | --- | --- |
| Git (Git Bash on Windows) | yes | yes | yes (winget, Xcode tools, apt/dnf/pacman) |
| Node.js 22.18 or newer | yes | yes | yes; with nvm-windows it prints the `nvm` commands instead |
| Bun | yes | yes | yes (official installer) |
| Java 17 JDK | for Android | Android Studio's bundled JDK is enough | yes (Expo) |
| Android Studio, SDK, NDK, emulator | for Android | for Android | Studio yes; SDK, NDK and emulator through `android-setup` |
| Rust (rustup) and the Android Rust targets | no | yes | yes, in one run |
| C++ build tools (Windows), Xcode tools (macOS), WebKitGTK packages (Linux) | no | yes | yes |
| Xcode and CocoaPods (macOS) | for iOS | for iOS | CocoaPods yes; Xcode is a manual App Store step |
| Watchman (macOS) | recommended | no | yes |
| Expo account and Apple or Google developer accounts | for cloud builds and stores | for stores | no (accounts are yours to create) |

The same three commands work for a person and for an agent, so the quickest path is:

```bash
bash start.sh doctor --platform tauri        # or expo
bash start.sh install-prereqs --platform tauri --yes
bash start.sh android-setup --set-env        # only for Android; after Android Studio's first launch
```

Manual instructions for every tool, including Windows, macOS and Linux package names, are in
[`QUICKSTART.md`](QUICKSTART.md); an Expo app also carries `docs/LOCAL_SETUP.md`.

## Repository layout

| Path | Purpose |
| --- | --- |
| `start.sh` | Root entry point: `new`, `doctor`, `install-prereqs`, `android-setup`, `expo ...`, `tauri ...`, `verify`. |
| `scripts/` | Shared machine scripts and the `new` command; `scripts/lib/target.mjs` holds the rules that protect target folders. |
| `_expo/` | Expo platform: owned template, pinned upstream snapshot, generator, clean-app path, capability catalog, release scripts, playbook. |
| `_tauri2/` | Tauri 2 platform: template, Next.js and Konsta overlays, generator, capability catalog and installer, reference docs. |
| `AGENT_START.md`, `AGENTS.md`, `CLAUDE.md` | Agent entry points and workflow rules. |
| `.claude/skills/` | One skill per job (intake, machine setup, generate, screens, capabilities, template features, devices, troubleshoot, hand-off). |
| `prompts/` | Copy-and-paste prompts for common requests. |
| `docs/LESSONS_LEARNED.md` | Every setup problem found so far, its cause and the fix the scripts apply. |
| `docs/GAP_ANALYSIS.md` | What is ready, what was fixed, and the open items with priorities. Read this first when taking over the builder. |
| `docs/LUMNI_COMPARISON.md` | How LUMNI, the first app built from the Expo template, differs from it, and what the template took back. |
| `_expo/docs/FEATURES.md` | Inventory of the upstream Expo template's features and the switch, remove and add commands. |
| `tests/` | Builder tests; each platform also has its own `tests/`. |

## Rules the builder enforces

1. A target must be new, empty, or a fresh repository holding only `.git`, `.github`, README, LICENSE and
   ignore files. Those files are kept; the template's versions are placed beside them or merged in.
2. Nothing is pushed, published or submitted unless the command says so (`--push`, guarded release
   commands with explicit confirmation).
3. Optional features are installed one capability at a time and verified after each.
4. Server secrets never go into the app; `.env.example` files list only public, client-safe values.

## Roadmap

The status column below separates what is finished and tested from what is planned. Items marked
"planned" are not implemented.

| Area | Status | Notes |
| --- | --- | --- |
| Expo owned template (SDK 57) with auth, paywall, analytics, SQLite, notifications, EAS | Done | Verified: install, TypeScript, lint, format, unit tests, unused-code check. Expo Doctor needs the Expo API and runs on developer machines. |
| Expo Android launchers from LUMNI (emulator, USB, iOS Simulator, web, Expo Go, dev client) | Done | SDK/Java discovery, ADB restart, per-ABI builds, Gradle heap, Windows short-path CMake fix; the config plugin was tested against a real `expo prebuild`. |
| Expo clean path on the newest SDK (58) + NativeWind + React Native Reusables | Done | Verified with TypeScript and a full web export. |
| Tauri 2 template: Vite or Next.js, shadcn/ui or Konsta, Consta add-on | Done | All four combinations verified (install, TypeScript, Biome, Vitest, production build); Rust tests and Clippy pass. |
| Tauri mobile capability installer (13 plugins + Consta) | Done | Mobile-only plugins guarded with `#[cfg(mobile)]`; idempotent; unit-tested. |
| Generate into a new GitHub repository, commit and push | Done | Tested against a local bare repository. |
| Machine setup: doctor, install-prereqs (winget / Homebrew / apt-dnf-pacman), Android SDK + emulator | Done | Dry runs tested on Linux; installs on Windows and macOS use the package IDs listed in `QUICKSTART.md`. |
| Real Android and iOS builds of generated apps on a developer machine | In progress | On 2026-10-23 a Tauri app and an Expo app were each built, installed and opened on a Windows x86_64 emulator (Expo's stable Metro session, a USB phone and ARM devices are still open; see `docs/GAP_ANALYSIS.md` O-01); iOS needs a Mac or an EAS build. |
| Expo template feature switches: off/on, remove, add back, upstream onboarding funnel, choice in the plan | Done | Every feature removed and re-added on an installed app with all checks passing and a byte-identical result; funnel migration tested on PostgreSQL with row-level security. |
| Expo capability catalog extended with the packages LUMNI proved (16 new entries) | Done | Install and device-test each in the app that needs it. |
| AI section: on-device and cloud SDKs, OCR, detection, camera vision, server-proxy pattern | Next | Requested; see `docs/GAP_ANALYSIS.md` O-09. |
| Upgrade the owned Expo template from SDK 57 to 58 | Planned | Follow `_expo/docs/TEMPLATE_ADOPTION_PLAN.md`, phase 6. |
| Tauri modules: auth (OIDC), secure storage, push notifications, auto-update for stores | Planned | Can be ported from Desktop Starter App Builder's Tauri modules. |
| PowerShell entry point (`start.ps1`) | Planned | Git Bash is the supported Windows shell today. |
| Vue.js frontends | Not planned now | Deliberately out of scope. |
| Browser-extension sibling builder | Planned elsewhere | Same pattern, separate repository. |

## Credits and licenses

The Expo template is derived from Simonstorms' MIT-licensed expo-app-template
(`_expo/starter/SOURCE.json` records the pinned commit); generated Expo apps keep its `LICENSE`. The
Tauri template follows the structure of create-tauri-app's React + TypeScript template. Konsta UI and
shadcn/ui are MIT-licensed; Consta UIKit's npm package declares no license, which is why it is an opt-in
capability. Review the licenses of everything an app ships before distributing it.
