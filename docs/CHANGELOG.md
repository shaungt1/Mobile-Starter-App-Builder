# Changelog

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
