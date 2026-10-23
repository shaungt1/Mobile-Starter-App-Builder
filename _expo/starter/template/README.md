# Launchpad Expo starter

An owned Expo SDK 57 foundation for shipping unrelated mobile products without inheriting a demo app.
It includes Expo Router, NativeWind and accessible React Native Reusables-style UI primitives,
SQLite/Drizzle, typed API and device boundaries, optional Supabase auth, RevenueCat entitlements,
PostHog analytics, notifications, EAS profiles, checks, and guarded release scripts.

## Start

Requirements: Node 22.18+, Bun and Git, with Git Bash on Windows. Android runs also need a Java 17 JDK and
the Android SDK; iOS runs need macOS with Xcode. `bash start.sh system` reports what this machine can run.

```bash
bash start.sh setup          # check the machine, install locked dependencies, create .env, verify
bash start.sh                # interactive menu
```

The table below lists each way to run the app and what it can prove.

| Command                        | Runs the app on                        | Use it for                                     |
| ------------------------------ | -------------------------------------- | ---------------------------------------------- |
| `bash start.sh run web`        | a browser                              | screens, navigation, theme, cloud APIs         |
| `bash start.sh run go`         | Expo Go on a phone (same network)      | standard Expo SDK features only                |
| `bash start.sh run android`    | an Android emulator (booted if needed) | development build with every native module     |
| `bash start.sh run usb`        | an Android phone over USB              | real camera, Bluetooth, purchases, performance |
| `bash start.sh run ios`        | the iOS Simulator (macOS only)         | iOS development build                          |
| `bash start.sh run dev-client` | an already-installed development build | fast reload without rebuilding                 |

The Android launchers find the SDK and Java 17 themselves, build only the connected device's CPU
architecture, and on Windows map the project to a short drive letter during the native build so long
paths do not break CMake (see `scripts/lib/android.sh`). `bash start.sh devices` lists attached phones,
emulators and serial ports.

Edit `PROJECT_PLAN.json`, run `bash start.sh theme`, then replace icons and legal URLs. Use `.env.example`
as the environment contract. With blank service keys the app runs locally in guest mode.

## Verify

```bash
bash start.sh verify
```

This runs config checks, Expo Doctor, TypeScript, lint, formatting, unit tests, and unused-code checks.
Expo Doctor needs network access to the Expo API; `APP_SKIP_DOCTOR=1` skips it on machines that cannot reach it.
See `docs/TESTING.md` for native and service-specific gates.

## Where to work

- `src/app/`: routes and navigation gates
- `src/features/`: product feature screens, controllers/hooks, and feature APIs
- `src/components/ui/`: reusable accessible primitives
- `src/data/`: SQLite/Drizzle schema and repository adapters
- `src/core/`: provider-neutral API and hardware contracts
- `src/lib/`: configured infrastructure adapters
- `supabase/`: optional cloud schema, Edge Functions, and security tests

Read `AGENT_START.md` before agent-driven changes, `docs/SCREENS.md` before adding screens, and
`docs/CAPABILITIES.md` before adding native SDKs.
