# Gap analysis and engineering readiness

This document states what the Mobile Starter App Builder can be relied on for today, what was fixed in
the review of 2026-10-23, and what remains open. It is written for the engineers who will use the
builder. "Verified" below means a command was run and passed in the builder's cloud test environment
(Linux, Node 22.22, Bun, Rust); anything that needs a phone, an emulator, a Mac, an account or the Expo
API is listed as not verified.

## 1. Ready to use

| Area | State | Evidence |
| --- | --- | --- |
| Generate an Expo app (owned template, SDK 57) into a folder or a new GitHub repository | Ready | Generated, installed; TypeScript, oxlint, oxfmt, knip and unit tests pass. |
| Switch off, remove and add back Expo template features; add the upstream onboarding funnel | Ready | 11 builder unit tests; every feature removed and re-added on an installed app with all checks passing and the app restored byte for byte; funnel added and removed the same way. |
| Funnel database migration | Ready | `0001` and `0002` applied to PostgreSQL 16 with Supabase role and `auth` shims; row-level security allowed own rows and denied other users' rows and anonymous access. Not yet applied to a real Supabase project. |
| Generate an Expo app on the newest SDK (58) with NativeWind and React Native Reusables (clean path) | Ready | TypeScript and a full web export pass. |
| Generate a Tauri 2 app (Vite or Next.js; shadcn/ui or Konsta UI; Consta add-on) | Ready | All four combinations: install, TypeScript, Biome, Vitest, production build, `cargo test`, Clippy. |
| Capability catalogs (Expo 31 entries, Tauri 14 entries) | Ready to install from; each entry lists follow-up steps | Catalog JSON validated; installers unit-tested. Individual native capabilities need a device test in the app. |
| Machine set-up scripts (`doctor`, `install-prereqs`, `android-setup`) | Ready on Windows (Git Bash), macOS and Linux | Dry runs on Linux; Windows and macOS package IDs are listed in `QUICKSTART.md`. |
| Agent layer: `AGENT_START.md`, nine skills, four prompts | Ready | Skills reference only commands that exist. |
| Builder continuous integration | Ready | `.github/workflows/verify.yml` runs `scripts/verify-builder.sh` on every push and pull request. |

## 2. Fixed in this review

| ID | Gap | Fix |
| --- | --- | --- |
| F-01 | No way to turn template features (auth, paywall, analytics, notifications, database, device modules, updates) off or remove them; engineers had to delete files by hand and break imports. | `bash start.sh expo feature ...` with soft switches in `src/constants/features.ts`, hard removal with export-compatible stubs, exact restore, and plan-driven choice at creation. |
| F-02 | The upstream onboarding funnel and full paywall were dropped from the owned template with no way back. | Restorable `funnel` feature (78 files, migration, packages), checked against the owned template. |
| F-03 | No document listed what the upstream template contains. | `_expo/docs/FEATURES.md` (inventory, origins, switch reference) and the app-side `docs/FEATURES.md`. |
| F-04 | No record of how LUMNI differs from the templates. | `docs/LUMNI_COMPARISON.md`. |
| F-05 | The owned Settings screen had lost the upstream analytics opt-out switch and Manage subscription button. | Restored, shown only when PostHog or RevenueCat is configured. |
| F-06 | Both generators dropped the `screens` list from the project plan, although the intake and screens skills rely on it. | Kept in `PROJECT_PLAN.json`; covered by a test. |
| F-07 | About 60 packages LUMNI depended on were in neither the template nor the catalog. | 16 new Expo capabilities (UI extras, motion graphics, charts, state and storage, translations, fonts, biometrics, native Google Sign-In, background tasks, media and system, cryptography, content display, signal maths, WebRTC, testing and debugging, extra haptics); LangChain added to `cloud-ai`. |
| F-08 | The builder repository had no CI. | GitHub Actions workflow. |
| F-09 | After a dependency change without install, `setup` failed on the frozen lockfile. | `.mobile-builder/lock-stale` makes the next `setup` refresh the lockfile once. |
| F-10 | Expo Doctor failed on every freshly generated Expo app on a developer machine (16 Expo packages one patch release behind SDK 57's current set); the owned template's pins had aged. | Template pins and `bun.lock` refreshed (Doctor 21/21 on a generated app, then type check, lint, format, unit tests, unused-code check and the full feature remove/add round trip passed); `bash start.sh setup --fix-expo` in an app re-aligns them later. |
| F-11 | Android launcher stopped with "Could not create the temporary M: mapping" when `M:` is a mapped network drive. | The launcher picks a free drive letter (found on a real Windows run). |
| F-12 | The first Gradle install failed with an ADB `Connection reset by peer`. | The launcher restarts ADB, waits for the device and retries once; the retry installed the app. Root cause of the flapping ADB server is not identified (`docs/LESSONS_LEARNED.md`). |
| F-13 | `install-prereqs` would install Node.js with winget over an nvm-windows installation. | With `nvm` on the PATH it prints `nvm install` / `nvm use` as a manual step instead. |
| F-14 | The Expo template lacked the upstream performance playbook and plain-language guides for running on devices and setting up a machine by hand. | `docs/PERFORMANCE.md`, `docs/RUNNING_ON_DEVICES.md` and `docs/LOCAL_SETUP.md` in generated Expo apps (checked against the template's files; the playbook was written for the upstream template and LUMNI). |

## 3. Open items

Priority: **P1** blocks shipping an app built with the builder; **P2** needed before the builder is
the team's default; **P3** improvement. "Decision" marks items that need a product or legal choice, not
only engineering.

| ID | Priority | Gap | What closes it |
| --- | --- | --- | --- |
| O-01 | P1 | Partly closed on 2026-10-23 (Windows 11, Android Studio, emulator `Pixel_8`, x86_64). **Tauri:** a generated app passed `bash start.sh verify` including Rust tests, then `run android` compiled the Rust core for Android, built, installed and opened it; the screen showed the Rust core reporting `android / x86_64`. **Expo:** an app compiled for Android (about ten minutes on a first build), installed after one automatic ADB restart, and the development client opened and connected to Metro once, but a stable Metro session was not achieved because the ADB server kept restarting on that machine (`docs/LESSONS_LEARNED.md`). Still open: a USB phone and `run usb`, a clean Expo Metro session, a release build, and every ARM device (only x86_64 was run). | Repeat on a physical phone; for Expo find what keeps restarting ADB on a given machine; run `bash start.sh build android --apk` for Tauri and an EAS build for Expo. |
| O-02 | P1 | No iOS build has been run (Expo or Tauri). | Expo: an EAS cloud build (needs an Expo account and Apple Developer account). Tauri: a Mac with Xcode. |
| O-03 | P1 | Closed on 2026-10-23: Expo Doctor ran on a generated app on Windows and passed 21/21 after the pins were refreshed (F-10). It will fail again when Expo publishes further patch releases. | `bash start.sh setup --fix-expo` in the app, then refresh the template pins. |
| O-04 | P2 | The owned Expo template is on SDK 57; SDK 58 is current (the clean path already uses it). | Follow `_expo/docs/TEMPLATE_ADOPTION_PLAN.md`, phase 6, then re-run every feature test. |
| O-05 | P2 | Development-client rebuilds after removing a feature with native code are not tested. | Part of O-01: remove `payments` and `device-kit`, rebuild, launch. |
| O-06 | P2 | Only local notifications are implemented; remote push (Expo push service, FCM, APNs) needs a server and credentials. | Decision on push provider, then a server function plus the `notifications` capability steps. |
| O-07 | P2, decision | Crash reporting is not wired in the template (`@sentry/react-native` is only a catalog candidate; LUMNI used Sentry). | Choose Sentry or PostHog error tracking (already partly enabled through PostHog autocapture). |
| O-08 | P2 | The template has configuration unit tests but no component tests. | Install the `testing-debug` capability as a template default, or keep it opt-in (decision). |
| O-09 | P2 | The requested AI section (on-device and cloud SDKs, OCR, detection, camera vision, server-proxy pattern, what SDKs cannot do) is not written yet. | Research and write `docs/AI.md` and extend the `camera-vision`, `on-device-ai` and `cloud-ai` capabilities. |
| O-10 | P2, decision | Consta UIKit's npm package declares no license. | Legal review before any app ships it; until then keep it opt-in (current state). |
| O-11 | P2 | The funnel's questions, copy and graphs describe a demo spending product. | Replace per product after `add funnel` (the `mobile-features` skill says so). Apply the migration to a real Supabase project. |
| O-12 | P3 | The feature tool supports apps generated from this template version onward. Apps generated earlier (including LUMNI) lack `src/constants/features.ts` and may differ from the stubs' assumptions. | For older apps, switch features by editing code, or regenerate and move screens across. |
| O-13 | P3 | Removing a feature does not touch dashboards or data (Supabase project, RevenueCat products, PostHog project, EAS channels). | Manual clean-up; the skill tells the agent to list it. |
| O-14 | P3 | Tauri modules for OIDC sign-in, secure storage, push and store auto-update are not built. | Port from Desktop Starter App Builder's Tauri modules. |
| O-15 | P3 | Windows PowerShell entry point. | `start.ps1`; Git Bash works today. |
| O-16 | P3 | Translations: user-facing strings are English only, in `src/constants/content.ts`. | The `i18n` capability when a second language is needed. |

## 4. Housekeeping on the local clone

- Branch `backup/local-tauri-starter-2026-10-22` holds an earlier parallel Tauri implementation. It
  exists only in the local clone (pushing it needs GitHub credentials on that machine).
- The ignored folder `tauri-starter/node_modules` (about 126 MB) remains on disk from that work and can
  be deleted.

## 5. First day for an engineer

1. Clone the builder, open Git Bash in it, run `bash start.sh doctor --platform all`.
2. Install what is missing: `bash start.sh install-prereqs --platform expo` (or `tauri`), then
   `bash start.sh android-setup` for Android.
3. Write a plan from `_expo/starter/project-plan.example.json` (choose features, see
   `_expo/docs/FEATURES.md`) or `_tauri2/project-plan.example.json`.
4. `bash start.sh new --platform expo --plan plan.json --target ../my-app --yes --install`.
5. In the app: `bash start.sh verify`, then `bash start.sh run web` and `run android`.
6. Report anything that fails against `docs/LESSONS_LEARNED.md`; add new problems there.
