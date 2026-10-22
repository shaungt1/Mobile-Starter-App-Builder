# Agent start

## First commands

```bash
git status --short
bash start.sh system
bash start.sh verify
```

Read `README.md`, `docs/ARCHITECTURE.md`, `docs/CAPABILITIES.md`, `docs/SCREENS.md`, `PROJECT_PLAN.json`,
and `.env.example`. Preserve user changes and never commit `.env`, signing material, tokens, or service keys.

## Working rules

1. Keep core usable with no cloud accounts. SQLite/Drizzle is the default repository.
2. Supabase, RevenueCat, and PostHog must remain inert when their public client config is absent.
3. Add one native capability at a time. Record the package, config plugin, permissions, runtime limits,
   privacy impact, and real-device test. Rebuild the development client after native changes.
4. Put UI in `components/`, orchestration in feature hooks/controllers, external calls in services,
   and persistence behind repository interfaces. Screens should not contain provider-specific code.
5. Use `bunx expo install` for Expo/native modules and `bun add` for pure JavaScript modules.
6. Run `bash start.sh verify` before committing. A web launch does not prove native hardware behavior.
7. `EXPO_PUBLIC_*` values are public. Never place Supabase secret/service-role keys or AI provider keys
   in the app. Server secrets belong in an edge function or backend.
8. Supabase-exposed tables require both explicit grants and RLS. Test allow and deny behavior.
9. Release commands are guarded. Do not build, update, submit, or publish without explicit approval.

## Running and testing

Use `bash start.sh run web` for UI work, `run android` (emulator) or `run usb` (phone) for native work, and
`run ios` on macOS. Never start two Metro servers at once. If an Android build fails, check
`bash start.sh system` first; the launchers already handle SDK/Java discovery, ADB restarts, per-ABI builds,
the Gradle heap (`APP_GRADLE_HEAP_MB`) and long Windows paths (`APP_SUBST_DRIVE`).

## Definition of done

Report checks run, runtime(s) launched, capabilities selected, physical-device coverage, external
dashboard work, and any unverified platform. Do not call a native capability verified if no suitable
device/build was available.
