# Changelog

## 2026-10-23 - Expo template features, LUMNI comparison, gap analysis

### Added
- `bash start.sh expo feature list|status|on|off|remove|add`: switch the Expo template's built-in
  features off and on (`src/constants/features.ts`), remove them completely (export-compatible stubs,
  conditional package removal, config plugins, app.json keys, `.env.example` lines, CI jobs) and add them
  back exactly. Features: auth, payments, analytics, notifications, local-db, device-kit, ota-updates.
- Restorable `funnel` feature: the upstream 28-step onboarding, full custom paywall, hosted RevenueCat
  paywall and an `onboarding_responses` migration with row-level security.
- Project plans accept `features` (`off`, `remove`, `add`); generated apps record changes in
  `.mobile-builder/`.
- In-app `bash start.sh feature list|on|off` in generated Expo apps.
- 16 Expo capabilities from LUMNI's dependencies (UI extras, motion graphics, charts, state and storage,
  i18n, fonts, biometrics, native Google Sign-In, background tasks, media and system, cryptography,
  content display, signal maths, WebRTC, testing and debugging, extra haptics); LangChain in `cloud-ai`.
- Documents: `_expo/docs/FEATURES.md`, app `docs/FEATURES.md`, `docs/LUMNI_COMPARISON.md`,
  `docs/GAP_ANALYSIS.md`; skill `mobile-features`; prompt `prompts/toggle-features.md`.
- Builder CI workflow (`.github/workflows/verify.yml`).

### Fixed
- The owned Settings screen regained the analytics opt-out switch and Manage subscription button.
- Both generators kept the plan's `screens` list.
- `setup` refreshes the lockfile once after a feature change made without installing.

### Verified in this change
- 11 Expo builder tests (feature manifest, stub exports, full remove/add and funnel round trips, flags),
  Tauri and shared tests, Bash syntax, ShellCheck, JSON validity.
- On an installed generated app: each feature removed alone, all removed together, and the funnel
  added; typecheck, lint, format, knip and unit tests passed each time, and adding back produced a
  byte-identical app. Soft switches all off: same checks passed.
- Template and funnel migrations applied on PostgreSQL 16 with Supabase shims; row-level security
  allowed own rows and denied others' and anonymous access.
- Not verified: native Android or iOS builds, Expo Doctor (no Expo API access), a real Supabase project.

## 2026-10-22 - Mobile Starter App Builder: Expo + Tauri 2

### Added
- Repository renamed in content to Mobile Starter App Builder and split into `_expo/` (all previous Expo
  material, history preserved) and `_tauri2/` (new), with a root `start.sh`.
- `start.sh new`: guided or flag-driven creation into a folder or a newly created GitHub repository
  (clone, keep README/LICENSE/ignore files, generate, optional setup, commit and push).
- Machine scripts: `doctor`, `install-prereqs` (Windows Git Bash via winget, macOS via Homebrew, Linux
  via apt/dnf/pacman), `android-setup` (SDK packages, NDK, system image, emulator, environment variables).
- Tauri 2 platform: phone-first template (Vite + React + TanStack Router + Tailwind 4 + shadcn/ui, Motion,
  @use-gesture), Next.js and Konsta UI overlays, Rust core with typed commands, 14-entry capability
  catalog and installer (mobile-only plugins guarded with `#[cfg(mobile)]`), reference docs, tests.
- Expo template: LUMNI's Android launchers made generic (emulator, USB phone, iOS Simulator, web, Metro),
  `check-devices`, expanded `check-system`, the Windows long-path CMake plugin, interactive `start.sh`,
  `docs/SCREENS.md`.
- Expo clean path (`_expo/clean/create-clean.sh`): newest Expo SDK + NativeWind + React Native Reusables,
  demo removed, offline component fallback.
- Agent layer: root `AGENT_START.md`, eight skills in `.claude/skills/`, prompts, `docs/LESSONS_LEARNED.md`.
- Builder tests: target-folder rules, both generators, all four Tauri combinations (`start.sh verify --full`).

### Fixed
- Expo generator and `configure` never wrote the app name into `brand.ts` (quote-style mismatch).
- Expo template: `knip` script renamed to `check:unused` (Expo Doctor conflict); `select.tsx` formatting;
  `PROJECT_PLAN.json` written in the formatter's layout.
- Expo generator test depended on the current directory.

### Verified in this change
- Builder: 12 unit tests, Bash syntax, ShellCheck (warnings), JSON validity.
- Expo owned template: generated into a repository-style folder, `setup` and `verify` passed (TypeScript,
  Oxlint, Oxfmt, unit tests, Knip); Expo Doctor was not run because the test machine could not reach the
  Expo API. The CMake plugin was applied by a real `expo prebuild --platform android`.
- Expo clean path: TypeScript and a full web export passed on SDK 58.
- Tauri: all four frontend/UI combinations passed install, TypeScript, Biome, Vitest and production
  build; `cargo test` and `cargo clippy -D warnings` passed; screens rendered at phone size in Chromium
  and a pointer swipe revealed and triggered the row action.
- Not verified here: Android/iOS native builds and emulator launches (no Android SDK or Mac available on
  the test machine), and installs through winget/Homebrew.
