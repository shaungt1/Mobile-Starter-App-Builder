# Agent start: Mobile Starter App Builder

This is the canonical instruction file for an AI agent using this repository. It defines the workflow
from a request such as "build a mobile app in this repository" to a verified, running app, and the rules
that keep the user's work safe. Platform details are in `_expo/AGENT_START.md` and
`_tauri2/AGENT_START.md`; read the one for the chosen platform after this file.

## What this repository is

A generator. It writes a new app into another folder or repository and never copies itself there. Do
not build an app inside this repository, and do not change files here unless the task is to improve the
builder itself (then run `bash start.sh verify` before finishing).

## Workflow

Each stage ends with a check; do not start the next stage while the current check fails.

1. **Intake** (skill `mobile-intake`). Collect only what the user has not already said: platform (`expo`,
   `expo-clean` or `tauri`; if undecided, show the comparison in `_tauri2/README.md` and let the user
   choose), app name, bundle ID, target folder or GitHub repository URL, brand colors, the screens, and
   the capabilities needed now. For Tauri also the frontend (`vite`/`nextjs`) and kit (`shadcn`/`konsta`).
   Write the decisions into a plan file and show it.
2. **Machine** (skill `mobile-host-setup`). `bash start.sh doctor --platform <p>`. Install anything missing
   with `bash start.sh install-prereqs --platform <p>` and, for Android, `bash start.sh android-setup`.
   Some steps are manual (Android Studio's first-launch wizard, Xcode from the App Store); tell the user
   exactly which and continue with what is possible.
3. **Generate** (skill `mobile-generate`).
   `bash start.sh new --platform <p> --plan <plan> --target <folder>` or `--repo <url> [--target <clone folder>]`,
   with `--yes`. Add `--install` to run setup, `--commit` for the first commit, and `--push` only when the
   user asked for the app to be pushed.
4. **Setup and verify** in the app folder: `bash start.sh setup`, then `bash start.sh verify`. A failed
   baseline is fixed before anything else (skill `mobile-troubleshoot`, `docs/LESSONS_LEARNED.md`).
5. **Run** (skill `mobile-run-device`): web first, then an emulator or device. State which targets could
   not be run and why.
6. **Capabilities** (skill `mobile-capability`): add one, verify, run on a device that supports it, repeat.
   To switch off, remove or add back an Expo template feature (auth, payments, analytics, notifications,
   local database, device modules, updates, onboarding funnel) use skill `mobile-features`.
7. **Screens** (skill `mobile-screens`): follow the app's `docs/SCREENS.md`; mock data first.
8. **Hand-off** (skill `mobile-handoff`): report as described below.

## Safety rules

- Never write into a folder that holds anything except `.git`, `.github`, README, LICENSE and ignore files;
  the generators refuse, and an agent must not work around that by deleting files.
- Never commit `.env`, keystores, provisioning profiles, signing passwords or API secrets. Values prefixed
  `EXPO_PUBLIC_` or `VITE_` are compiled into the app and are public.
- Push, publish, submit to a store, or send an over-the-air update only when the user asked for it.
- Confirm current official documentation before changing SDK versions, signing, store or privacy settings.
- Install native capabilities one at a time; a device test is the only proof that hardware features work.

## Hand-off report

List: the plan used; every command run and its result; which checks passed; which targets were launched
(web, Expo Go, Android emulator, USB phone, iOS Simulator, Tauri desktop preview); what was not verified
and why; capabilities installed; manual steps left for the user (accounts, dashboards, signing); the
app's path, Git branch, commit and whether it was pushed.
