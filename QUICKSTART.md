# Quick start

This page takes a developer from a fresh machine to a running app. Commands run from the repository
root in Git Bash on Windows (installed with Git for Windows) or a normal terminal on macOS and Linux.

## 1. Check the machine

```bash
bash start.sh doctor                    # both platforms; or --platform expo / --platform tauri
```

The report marks each tool OK or MISSING and says which targets (web, Expo Go, Android emulator, USB
phone, iOS Simulator, Tauri desktop preview) this machine can run.

## 2. Install what is missing

```bash
bash start.sh install-prereqs --dry-run    # see the plan without changing anything
bash start.sh install-prereqs              # install (asks once)
```

The installer uses these sources; the Windows package IDs come from the winget package repository.

| Tool | Windows (winget ID) | macOS | Linux |
| --- | --- | --- | --- |
| Git | `Git.Git` | Xcode Command Line Tools | apt/dnf/pacman `git` |
| Node.js LTS (22.18+) | `OpenJS.NodeJS.LTS` | `brew install node` | nodejs.org download (manual) |
| Bun | `Oven-sh.Bun` | official script | official script |
| Java 17 JDK (Expo Android) | `Microsoft.OpenJDK.17` (ID not verified by this project; falls back to a manual step) | `brew install --cask microsoft-openjdk@17` | `openjdk-17-jdk` / `java-17-openjdk-devel` |
| Android Studio | `Google.AndroidStudio` | `brew install --cask android-studio` | manual download to `/opt/android-studio` |
| Rust (Tauri) | `Rustlang.Rustup` | official rustup script | official rustup script |
| C++ build tools (Tauri, Windows) | `Microsoft.VisualStudio.BuildTools` with the VCTools workload | Xcode Command Line Tools | WebKitGTK 4.1 and build packages |
| iOS (Mac only) | not possible | Xcode (App Store), `brew install cocoapods` | not possible |

Open Android Studio once and finish its setup wizard, make sure "Android SDK Command-line Tools (latest)"
is ticked in SDK Manager > SDK Tools, then:

```bash
bash start.sh android-setup --dry-run      # shows packages: platform-tools, emulator, android-35, build-tools 36.0.0, NDK, system image
bash start.sh android-setup --set-env      # installs them, accepts licenses (asks), creates an emulator, saves ANDROID_HOME/NDK_HOME
```

On Windows, close and reopen Git Bash and VS Code after installs so the new tools are on PATH.

## 3. Create an app

```bash
bash start.sh new
```

The command asks for the platform, the folder (or a GitHub repository URL), the name and bundle ID, and
for Tauri the frontend and UI kit. Every answer can be given as a flag instead; see
`bash start.sh new --help`. A repository must be new: only `.git`, `.github`, README, LICENSE and ignore
files may exist in it. Those files are kept.

| Platform flag | Produces |
| --- | --- |
| `--platform expo` | the owned Expo template: auth, paywall, analytics, local SQL, notifications, EAS, launch scripts |
| `--platform expo-clean` | Expo's current template (newest SDK) with NativeWind and React Native Reusables, demo removed |
| `--platform tauri` | a Tauri 2 app: Vite or Next.js, shadcn/ui or Konsta UI, Rust core, mobile plugin catalog |

## 4. Run it

```bash
cd ../<app>
bash start.sh setup          # dependencies, .env, native projects, checks
bash start.sh                # menu
```

Expo apps: `run web`, `run go`, `run android` (emulator, booted automatically), `run usb` (phone),
`run ios` (Mac), `run dev-client`. Tauri apps: `run web`, `run desktop`, `run android`, `run ios` (Mac).

## Manual path without the scripts

For Expo, `_expo/QUICKSTART.md` ("Manual setup") lists each command. For Tauri, follow
`_tauri2/docs/reference/01-prerequisites.md` and `14-mobile.md`, then copy `_tauri2/template` into a new
folder and replace the `__APP_NAME__`, `__APP_SLUG__` and `__APP_ID__` placeholders.

## Troubleshooting

`docs/LESSONS_LEARNED.md` lists every problem met so far with its cause and fix.
