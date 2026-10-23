# Tauri 2 mobile platform

This folder generates mobile apps built with Tauri 2. Tauri is an application framework that combines a
web interface with a compiled Rust core; since version 2 it builds Android and iOS apps (and desktop
apps) from one project. The interface runs in the phone's own web view, so the app stays small, and any
native work (files, database, sensors, camera scanning) is done in Rust or through official plugins that
the interface may call only with explicitly granted permissions.

## When to choose Tauri instead of Expo

The two platforms solve the same problem differently, and the choice is the product owner's. The table
below states the facts that usually decide it.

| Question | Expo (`_expo/`) | Tauri 2 (`_tauri2/`) |
| --- | --- | --- |
| How the screen is drawn | native views (React Native) | the OS web view (HTML/CSS) |
| Interface code | React Native + NativeWind + React Native Reusables (shadcn for RN) | React (Vite or Next.js) + Tailwind + shadcn/ui |
| Native code language | Kotlin/Swift modules, mostly via npm packages | Rust, plus official Tauri plugins |
| Reuse of an existing web (Next.js/React) UI | partial (React Native components differ) | high (same web components) |
| Ready-made product features in the template | auth, paywall, analytics, local SQL, notifications, EAS | shell, theme, gestures, typed commands; features via capabilities |
| Cloud build service for iOS from Windows | EAS Build | none built in (iOS builds need a Mac) |
| Desktop app from the same code | no (web only) | yes |

## What a generated app contains

Every app starts from `template/` and gets the following; the plan then chooses the options after it.

1. A phone-first shell: top bar, bottom tab bar, safe-area padding for notches, animated screen changes
   that respect "reduce motion", and light/dark/system theme saved with the store plugin.
2. Three starter screens: Home (runtime details from Rust), Explore (swipe-to-reveal list using
   `@use-gesture/react` and Motion) and Settings (appearance).
3. A Rust core with one entry point for desktop, Android and iOS, two typed commands, one error type,
   log/store/opener plugins, deny-by-default permissions and a strict content security policy.
4. Scripts: `setup` (dependencies, native projects, icons, checks), `verify`, `run web|desktop|android|ios`,
   `build android|ios`, `system`, plus `AGENTS.md`, `docs/SCREENS.md`, `docs/reference/` and CI.

The plan options are listed below.

| Plan field | Choices | Default |
| --- | --- | --- |
| `frontend` | `vite` (React + Vite + TanStack Router) or `nextjs` (Next.js App Router, static export) | `vite` |
| `ui` | `shadcn` (shadcn/ui) or `konsta` (Konsta UI: iOS or Material look) | `shadcn` |
| `uiTheme` | `ios` or `material` (Konsta only) | `ios` |
| `capabilities` | ids from `config/capabilities.json` (`bash start.sh tauri capability list`) | none |

Consta UIKit is offered as the `consta-ui` capability, a secondary component library added on top of
shadcn/ui rather than replacing it.

## Folder map

| Path | Contents |
| --- | --- |
| `template/` | the owned app template (Vite + React + shadcn/ui + Rust core) |
| `overlays/nextjs/`, `overlays/konsta/` | file sets and edits applied for the Next.js frontend and the Konsta kit |
| `generator/` | plan validation, overlays, identity/theme, and the capability installer |
| `config/capabilities.json` | mobile plugins and UI kits with packages, registration, permissions and iOS keys |
| `docs/reference/` | reference pages written from the official Tauri documentation (prerequisites, security, plugins, mobile, Next.js, stores, UI kits); copied into every app |
| `tests/` | generator unit tests and the all-combinations template check |

## Commands

From the repository root: `bash start.sh new --platform tauri` (guided), or
`bash start.sh tauri create <folder> --plan <plan.json>`, `bash start.sh tauri capability list|show|install`,
and `bash start.sh tauri starter verify` (generates and checks all four frontend/UI combinations).

## Known limits

Tauri's iOS commands exist only on macOS. Android emulators and iOS simulators cannot test camera
scanning, NFC, biometrics or haptics; use a physical device. End-to-end UI automation on phones is not
streamlined in Tauri 2 (the docs point to Appium); this template covers logic with Vitest and IPC mocks.
