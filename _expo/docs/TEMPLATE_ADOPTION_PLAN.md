# In-house Expo template adoption plan

## Goal

Own a generic, tested Expo starter that preserves the useful capabilities of the Simonstorms template
and the operational lessons from LUMNI, while avoiding product-specific code, unused native packages,
and accidental dependence on another repository's Git history.

The recommended end state is two repositories:

1. **This playbook:** decisions, automation, capability catalog, reusable snippets, and migration notes.
2. **An in-house template app:** a runnable, minimal Expo application with capability flags and tests.

Keeping the runnable template separate lets this repository stay small while giving upgrades a real
application on which Expo Doctor, typecheck, tests, dev builds, and store release checks can run.

## Current source baseline

- Upstream: `https://github.com/Simonstorms/expo-app-template`
- Current upstream audit: `888b9e131bdab4354c2bff7ea1fb744667269b10` (2026-09-14)
- LUMNI recorded source commit: `31bbcf5a93856d8a4f85c57e4a556f4363311ad1` (2026-07-26)
- LUMNI currently demonstrates Expo SDK 57 / React Native 0.86, Bun, Expo Router, NativeWind and owned
  UI primitives, Supabase auth/data, RevenueCat, PostHog, notifications, EAS, SQLite/Drizzle packages,
  animations/gestures, and optional hardware/AI dependencies.

These versions are an audit snapshot, not a permanent recommendation. A new adoption run must record
the current upstream commit and read its actual `package.json`, lockfile, release notes, and license.

## Phase 1 — create the owned baseline

1. Choose and record a reviewed upstream commit.
2. Clone it into a new empty internal repository; preserve `LICENSE` and create `NOTICE` with URL,
   source commit, date, and a summary of modifications.
3. Remove upstream Git metadata and workflows that point at upstream infrastructure.
4. Replace names, schemes, bundle IDs, icons, URLs, EAS owner/project IDs, demo copy, and provider IDs
   with obvious generic placeholders.
5. Keep a zero-config demo path: missing service keys should disable optional integrations cleanly.
6. Add `.nvmrc`/runtime constraints, `packageManager`, deterministic Bun lockfile install, CI, and the
   runtime scripts proven by LUMNI.
7. Run Expo Doctor, typecheck, lint, format, tests, web, Expo Go, Android/iOS development builds, and a
   physical-device smoke test before tagging `v1.0.0`.

## Phase 2 — divide core from optional capabilities

Keep the core intentionally small:

- Expo Router, TypeScript, safe areas/screens, gesture handler, Reanimated, SVG.
- NativeWind/theme tokens, accessible owned UI primitives, forms/schema validation.
- Mock service interfaces, error boundary, logging, basic tests, env validation, and EAS profiles.
- Secure-storage and native-runtime guards that degrade safely on web/Expo Go.

Move these behind capability flags or installation recipes:

- Supabase auth/data and Apple/Google login.
- RevenueCat, PostHog/Sentry, notifications, OTA updates.
- SQLite/Drizzle, MMKV, ElectricSQL sync.
- BLE, local networking/MQTT, camera/OCR, audio/speech, Skia/Rive, and on-device AI.

Every optional capability needs: packages, config-plugin/permission changes, env variables, dashboard
steps, a mock/disabled path, a minimal integration test, supported runtimes, privacy/store impact, and
an uninstall recipe.

## Phase 3 — persistence and sync reference architecture

Implement and test in layers:

1. Typed repository interfaces and deterministic in-memory fixtures.
2. AsyncStorage/SecureStore for small preferences and auth sessions.
3. SQLite + Drizzle migrations for domain data and offline operation.
4. Supabase/Postgres for server authority, auth, RLS, edge functions, and generated types.
5. ElectricSQL only after conflict policy, shape authorization, migrations, offline queue behavior,
   tombstones, account deletion, multi-device convergence, and service topology are documented.

Do not describe ElectricSQL as “installed” until an end-to-end offline → reconnect → conflict → sync
test passes against the chosen Postgres deployment.

## Phase 4 — design system and interaction baseline

- Use semantic tokens rather than product color names; ship a neutral blue/purple example palette.
- Centralize typography, spacing, radius, elevation, gradients, motion durations, and reduced-motion
  behavior.
- Preserve accessible React Native primitives and the `cn()` composition pattern.
- Provide reference screens for forms, lists, empty/loading/error states, dialogs, sheets, navigation,
  and theme switching—not a product-specific onboarding funnel.
- Test screen readers, dynamic type, keyboard navigation on web, touch targets, contrast, and motion
  reduction before calling the UI layer production-ready.

## Phase 5 — security, privacy, and release readiness

- Keep server secrets behind authenticated edge/API handlers; validate all client input server-side.
- Add Supabase Data API exposure/grant checks, RLS tests, `security_invoker` views, OAuth redirect
  checks, account deletion/session revocation, data retention, and least-privilege examples. Never use
  user-editable `user_metadata` for authorization.
- Maintain configurable privacy-manifest and store-disclosure checklists rather than declaring data the
  app may not collect.
- Exercise RevenueCat sandbox purchase/restore, notification permissions and delivery, analytics opt
  out, deep links, OTA runtime compatibility, and error recovery on physical devices.
- Require an explicit confirmation for production builds, OTA publishing, hosting, and submissions.

## Phase 6 — update process

Run quarterly and before any new app:

1. Fetch upstream and official Expo/React Native/Bun/EAS release notes.
   Also scan the Supabase changelog when auth/data is enabled; the 2026 client line requires Node 22+
   and new projects may not auto-expose SQL-created tables to the Data API.
2. Open an update branch and record old/new versions plus breaking changes.
3. Upgrade with official codemods/install tooling; never hand-wave dependency warnings.
4. Run the complete core matrix and each enabled capability's smoke test.
5. Update the capability catalog, docs, source attribution, and known limitations.
6. Merge only after a runnable template artifact passes; tag it and pin new applications to that tag.

## Migration completion criteria

The playbook can stop depending on upstream at bootstrap time when the owned template has:

- Clear licensing/provenance and a stable internal remote.
- A minimal default dependency graph with every optional feature removable.
- Zero-config demo operation and validated production configuration.
- Automated setup/check/run/release scripts on Windows Bash, macOS, and Linux.
- Passing web, Expo Go, Android/iOS dev-client, EAS preview, and physical-device smoke tests.
- Auth, data, payments, analytics, notifications, offline storage, and release recipes that are generic,
  tested, and documented without LUMNI branding.
