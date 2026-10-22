# Agent instructions for this app

This file is the entry point for any AI coding agent working in this repository. Read it fully, then
`README.md`, `PROJECT_PLAN.json` and `docs/SCREENS.md`, before changing anything.

## First commands

```bash
git status --short
bash start.sh system
bash start.sh verify
```

If `verify` fails on a clean checkout, fix that first and change nothing else.

## Rules

1. Keep the interface working in a plain browser: guard Rust calls with `isTauri()` from `src/lib/ipc.ts`.
2. Native work goes in a Rust command (`src-tauri/src/commands.rs`, registered in `lib.rs`) with a typed
   wrapper in `src/lib/ipc.ts`. One `AppError` type serializes errors as readable messages.
3. Grant the narrowest permission that works, in `src-tauri/capabilities/`. Mobile-only permissions go in
   `mobile.json` with `"platforms": ["iOS", "android"]` (exact spelling).
4. Add plugins with the builder's installer (`bash start.sh tauri capability install <id> <this folder>`
   from the builder) or follow `docs/reference/06-plugins.md` by hand. Mobile-only plugins must be
   limited to the mobile target in `Cargo.toml` and registered under `#[cfg(mobile)]`, or the desktop
   preview stops compiling. `tauri add` does not add that guard.
5. Screens follow `docs/SCREENS.md`: mock data first, theme tokens, loading/empty/error states, labels.
6. Never commit `.env`, keystores, `keystore.properties`, provisioning profiles or signing passwords.
7. Do not upload, publish or submit builds without explicit approval from the user.

## Definition of done

Report the commands run, which targets were launched (browser, desktop, Android emulator or phone, iOS),
what was not tested and why (for example no Mac, no physical device), and the files changed.
`docs/reference/09-agent-recipes.md` has step-by-step recipes for common changes.
