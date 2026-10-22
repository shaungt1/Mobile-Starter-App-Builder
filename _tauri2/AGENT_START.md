# Agent start: Tauri 2 mobile apps

This file tells an agent how to create or extend a Tauri 2 mobile app with this builder. The root
`AGENT_START.md` defines the overall workflow and safety rules; this file adds what is specific to Tauri.

## Decisions to collect (only those the user has not already given)

1. Name, bundle ID (reverse-DNS, each segment starting with a letter), and the target folder or the
   new GitHub repository to generate into.
2. Frontend: `vite` (default) or `nextjs` (choose Next.js when the app will share code with an existing
   Next.js web app).
3. Interface kit: `shadcn` (default) or `konsta` with `ios` or `material`. Consta UIKit is an add-on
   capability (`consta-ui`), never a replacement for shadcn/ui.
4. Capabilities needed now (`bash start.sh tauri capability list`); add others later, one at a time.
5. Brand colors as HSL triplets, and the screen list (route, purpose, data, actions).

## Sequence

1. `bash start.sh doctor --platform tauri`; if Android tools are missing, `bash start.sh install-prereqs
   --platform tauri`, then `bash start.sh android-setup`. iOS needs a Mac.
2. Generate: `bash start.sh new --platform tauri --target <folder>` or `--repo <url>` plus the decisions
   as flags (`--name`, `--bundle-id`, `--frontend`, `--ui`, `--ui-theme`, `--capabilities`, `--yes`).
3. In the app folder: `bash start.sh setup`. It creates `src-tauri/gen/android` (and `gen/apple` on a
   Mac) only when the tools exist; otherwise it says what is missing.
4. `bash start.sh verify` must pass before any screen work.
5. Launch: `run web` first, then `run desktop`, then `run android` / `run ios` when available.
6. Build screens with the app's `docs/SCREENS.md`; add capabilities with the installer, verifying after each.
7. Hand off with the root `AGENT_START.md` report format.

## Tauri-specific pitfalls

- A mobile-only plugin registered without `#[cfg(mobile)]` breaks the desktop build; the installer adds
  the guard, `tauri add` does not.
- Capability platform names are case-sensitive: `"iOS"`, `"android"`, `"macOS"`, `"windows"`, `"linux"`.
- The dev server must honor `TAURI_DEV_HOST` for physical devices (already done in `vite.config.ts` and
  `next.config.ts`).
- `tauri.conf.json`'s `identifier` becomes the Android package and iOS bundle ID; changing it after
  `tauri android init` / `tauri ios init` likely requires running init again.
- Rust builds need the app icons in `src-tauri/icons`; regenerate them with `bash start.sh icons`.
