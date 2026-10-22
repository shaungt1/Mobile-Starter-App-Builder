# __APP_NAME__

__APP_NAME__ is a Tauri 2 mobile application. Tauri packages a web interface (React, styled with Tailwind
CSS and shadcn/ui components) together with a compiled Rust core into a native app for Android and iOS;
the same project also opens as a phone-sized window on a desktop computer for fast previewing. The
interface runs in the operating system's own web view (Android System WebView on Android, WKWebView on
iOS), and it calls Rust through typed commands for anything native.

## Requirements

The table below lists what each target needs; `bash start.sh system` reports what this machine has.

| Target | Needs |
| --- | --- |
| Browser preview | Node.js 22.18+, Bun, Git |
| Desktop preview window | the above plus Rust 1.90+ and the OS build tools (C++ Build Tools on Windows, Xcode Command Line Tools on macOS, WebKitGTK 4.1 on Linux) |
| Android | the above plus Android Studio with SDK, NDK and command-line tools, a JDK, and the four Android Rust targets |
| iOS | a Mac with full Xcode, CocoaPods and the three iOS Rust targets |

## Start

```bash
bash start.sh setup        # dependencies, .env, native Android/iOS projects when tools exist, icons, checks
bash start.sh              # interactive menu
```

The run commands are listed below with what each one is for.

| Command | Opens the app in | Notes |
| --- | --- | --- |
| `bash start.sh run web` | a browser | Fastest UI loop; Rust commands are unavailable, screens say so |
| `bash start.sh run desktop` | a phone-sized desktop window | Real Rust commands; mobile-only plugins are absent |
| `bash start.sh run android` | an emulator or USB phone | Tauri asks which device when several are attached |
| `bash start.sh run ios` | the iOS Simulator or an iPhone | macOS only |

Release builds are local only and nothing is uploaded: `bash start.sh build android --aab` (or `--apk`)
and `bash start.sh build ios`. Store signing is described in `docs/reference/13-distribution-stores.md`.

## Verify

`bash start.sh verify` runs TypeScript, Biome (lint and format), Vitest unit tests, the production web
build and the Rust unit tests. Run it before every commit.

## Where to work

- `src/screens/` - one file per screen; `src/lib/nav-items.ts` lists the tab bar.
- `src/components/ui/` - shadcn/ui components; `src/components/app-layout.tsx` - the app shell.
- `src/lib/ipc.ts` - typed wrappers for Rust commands; `src-tauri/src/commands.rs` - the commands.
- `src-tauri/capabilities/` - permissions granted to the interface (nothing is allowed by default).
- `src-tauri/tauri.android.conf.json`, `tauri.ios.conf.json` - per-platform settings.
- `PROJECT_PLAN.json` - identity, theme, interface kit and enabled capabilities.

Read `AGENTS.md` before agent-driven changes and `docs/SCREENS.md` before adding screens. The reference
folder `docs/reference/` documents prerequisites, security, plugins, mobile builds and app stores.
