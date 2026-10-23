# Expo platform (Expo App Starter)

> **Location.** This is the Expo section of Mobile Starter App Builder. Commands below run from this
> `_expo/` folder (`cd _expo`), or from the repository root as `bash start.sh expo <command>`. The
> quickest path is the guided root command `bash start.sh new --platform expo`.

A reusable, agent-friendly system for generating an independently owned Expo application. It combines
a maintained local template, a pinned upstream snapshot, one project-plan contract, capability
selection, host checks, and guarded release commands.

The runnable generic starter lives in `starter/template`; generated apps copy it and receive their own
Git history. LUMNI remains a proven implementation reference, not a runtime dependency.

## Start here

- Human quick start: [`QUICKSTART.md`](QUICKSTART.md)
- Agent entry point: [`AGENT_START.md`](AGENT_START.md)
- Full technical guide: [`expo-app-starter-playbook.md`](expo-app-starter-playbook.md)
- Owned template: [`starter/README.md`](starter/README.md)
- Template adoption history: [`docs/TEMPLATE_ADOPTION_PLAN.md`](docs/TEMPLATE_ADOPTION_PLAN.md)

## Fastest path

From Git Bash, macOS, or Linux:

```bash
bash start.sh system
cp starter/project-plan.example.json ../my-app-plan.json
# Edit the plan.
bash start.sh create ../my-app --plan ../my-app-plan.json --install
cd ../my-app
bash start.sh run web
```

The generator copies the owned template, applies identity and theme, records the plan/source,
initializes an independent `main` branch, and optionally installs and verifies. It refuses non-empty
targets and does not create or push a remote. The older `bootstrap` command remains available when a
fresh clone of the preserved upstream project is specifically wanted.

For an existing app:

```bash
bash start.sh setup ../existing-app
bash start.sh verify ../existing-app
bash start.sh capabilities list
```

## Three ways to start an Expo app

1. **Owned template (recommended):** `bash start.sh create ../my-app --plan plan.json --install`. A
   complete, tested app (auth, paywall, analytics, local SQL, notifications, EAS, scripts) pinned to a
   reviewed Expo SDK. Any of those features can be switched off or removed, and the upstream 28-step
   onboarding funnel added: `bash start.sh feature list` and `docs/FEATURES.md`.
2. **Clean app on the newest SDK:** `bash start.sh clean ../my-app`. Expo's own current template with the
   demo removed, plus NativeWind, React Native Reusables (shadcn/ui for React Native), Reanimated,
   gestures, SVG, haptics and icons. Add product features from the capability catalog.
3. **Fresh upstream clone:** `bash start.sh bootstrap ...` (kept for reproducing the original template).

## What is included

| Path | Purpose |
| --- | --- |
| `start.sh` | Entry point for generation, setup, verification, running, capabilities, features, and releases. |
| `starter/upstream-snapshot/` | Complete pinned Simonstorms source, minus nested Git metadata. |
| `starter/template/` | Generic owned Expo app with UI, local SQL, optional services, scripts, and docs. |
| `starter/generator/` | Deterministic plan validation, copying, identity, and theme application. |
| `scripts/startup/` | Setup automation for existing or direct-upstream projects. |
| `config/capabilities.json` | Opt-in UI, auth, sync, payments, analytics, device, IoT, camera, audio, sensor, AI, charts, state, translation, testing and other catalog entries. |
| `features/`, `scripts/features.mjs` | Template feature manifest, export-compatible stubs, the restorable upstream funnel, and the switch/remove/add tool. |
| `docs/FEATURES.md` | Inventory of the upstream template and owned template, and the feature switch reference. |
| `clean/` | Brand-new app from Expo's current template + NativeWind + React Native Reusables (`start.sh clean`). |
| `code/` | Smaller drop-in reference files for existing projects. |

## Core rules

1. Keep the owned template and generator testable; never edit the upstream snapshot as application code.
2. Install one capability at a time and verify after each native/config change.
3. Use a development build for custom native modules and physical devices for hardware evidence.
4. Keep public client configuration separate from server secrets.
5. Never publish, submit, overwrite, or force-push without explicit authority.
6. Preserve the upstream MIT license and pinned source record.

## Requirements

- Git
- Node.js 22.18 or newer
- Bun
- Git Bash on Windows, or Bash on macOS/Linux
- Optional: Android Studio/JDK for local Android builds, macOS/Xcode for local iOS builds, and an Expo
  account for EAS builds/updates

Run `bash start.sh system` for a read-only host report.

## Credits and license

Generated applications are derived from Simonstorms' MIT-licensed Expo App Template. Preserve its
`LICENSE`, pinned source record, and attribution. Review all target-application licenses before
distribution.
