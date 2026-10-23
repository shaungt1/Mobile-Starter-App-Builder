# Expo template features: inventory and switches

This document lists everything the Expo template provides, where each part came from, and how to
switch each feature off, remove it, or add it back. It covers three codebases:

- **Upstream**: the Simonstorms Expo app template (MIT), copied into this repository at
  `_expo/starter/upstream-snapshot/` at commit `888b9e1` (captured 2026-09-18). The builder never
  downloads it again; the snapshot is the reference copy.
- **Owned template**: `_expo/starter/template/`, which every generated Expo app starts from. It was
  derived from the upstream snapshot and changed as described below.
- **LUMNI**: the first production app built from the upstream template (see
  `docs/LUMNI_COMPARISON.md`).

Terms used here:

- **Switch off** (soft): sets a flag in the app's `src/constants/features.ts` to `false`. The code and
  native packages stay; the service never starts, even when its keys are in `.env`, and its screens and
  gates step aside. Reversible by switching on. Use it to ship without a service for now.
- **Remove** (hard): replaces the feature's entry files with small stubs that keep the same exported
  names (so no other file needs editing), deletes its implementation files, uninstalls its packages when
  no remaining code imports them, removes their config plugins, app.json keys, `.env.example` lines and
  CI job, and switches its flag off. The removed files are kept in `.mobile-builder/removed/<id>/` so
  that "add" puts back exactly what was there, including any edits. Use it when the app will never need
  the feature and the binary should not carry it.
- **Add**: reverses a removal, or adds a restorable upstream feature that the owned template does not
  include.

## 1. Features of the upstream template

Everything below is in the upstream snapshot. The last column says what the owned template kept.

### 1.1 Product features

| Feature | What it does | Main files (upstream) | In owned template |
| --- | --- | --- | --- |
| Splash and routing gate | `src/app/index.tsx` decides where a user lands (onboarding, sign-in, paywall or tabs) from persisted state, session and entitlement. | `src/app/index.tsx`, `src/hooks/use-persist-hydrated.ts` | Kept, simplified to sign-in → paywall → tabs. The funnel version returns with `add funnel`. |
| Onboarding funnel | 28 steps (welcome, gender, usage, source, tried-before, results graph, habits, birthdate, goal, weekly spend, realistic target, pace, comparison, obstacles, potential graph, trust and privacy, Apple Health, savings preview, rollover, rating, notifications, referral, all-done, generating, plan-ready, sign-in, paywall). Answers persist in a Zustand store; a flow hook drives next/back with a selection haptic; staged progress animates the "generating your plan" step; projection graphs chart the user's plan. Answers are saved to Supabase `onboarding_responses`. | `src/features/onboarding/**` (steps, store, types, projection, flow, plan and staged-progress hooks, scaffold and header, 26 screens), 25 route files in `src/app/`, `src/lib/json.ts` | Removed (the content was a demo for one consumer product). Restorable as the `funnel` feature. |
| Sign-in and accounts | Sign in with Apple (native), Google (Supabase OAuth in a browser), secure chunked session storage, sign-out, in-app account deletion through a Supabase edge function. | `src/features/auth/**`, `src/lib/supabase.ts`, `src/lib/secure-storage.ts`, `supabase/` | Kept. Feature `auth`. |
| Subscriptions and paywall | RevenueCat SDK set-up, entitlement hook with a last-known grace period, paywall route and gate, customer center. Upstream ships a full custom paywall (plan options, pricing, trial card and timeline, app preview, welcome offer, decline sheet) and RevenueCat's hosted paywall screen. | `src/features/paywall/**`, `src/lib/revenuecat*.ts`, `scripts/setup-revenuecat.sh` | Kept the SDK, entitlement, gate and a simple paywall. The custom paywall components and hosted paywall screen return with `add funnel`. Feature `payments`. |
| Product analytics | PostHog provider, automatic screen tracking, typed event catalogue, identify/reset, super properties, feature flags, error autocapture, opt-out, optional session replay. | `src/lib/analytics.tsx`, `src/lib/analytics-events.ts`, `src/hooks/use-analytics-*.ts` | Kept. Feature `analytics`. |
| Local notifications | Schedules a reminder before the free trial ends; tapping a notification deep-links into the app. | `src/lib/notifications.ts`, `src/hooks/use-notification-intent.ts`, `src/app/+native-intent.tsx` | Kept. Feature `notifications`. |
| Tabs | Home and Settings tabs; Settings has sign-out, account deletion, Manage subscription (RevenueCat customer center) and an analytics opt-out switch. | `src/app/(tabs)/**`, `src/features/home`, `src/features/settings` | Kept. The owned Settings shows which services are configured, a Manage subscription button (when RevenueCat is configured), an analytics opt-out switch (when PostHog is configured), legal links, sign-out and account deletion. |
| Backend | Supabase migrations (initial schema, automatic row-level security), `secure-call` edge function with shared CORS, typed database definitions. | `supabase/**`, `src/types/database.ts` | Kept with a hardened schema (`0001_secure_app_schema.sql`). Removed with `auth`. |
| Over-the-air updates | `expo-updates` with `runtimeVersion` from the app version; EAS Update channels in `eas.json`. | `app.json`, `eas.json` | Kept. Feature `ota-updates`. |

### 1.2 UI, motion and gestures

| Item | Detail | In owned template |
| --- | --- | --- |
| Custom components (14) | `brand-logos`, `choice-pair-buttons`, `glass-icon-button`, `glass` (iOS liquid glass through `expo-glass-effect`, with a fallback), `gradient-ring`, `icon` (SF Symbols through `expo-symbols`), `notification-preview`, `phone-mockup`, `pressable-scale`, `primary-cta`, `screen-background`, `selection-row`, `title-block`, `trial-timeline` | All 14 kept, plus 32 React Native Reusables (shadcn) components: accordion, alert, alert-dialog, aspect-ratio, avatar, badge, button, card, checkbox, collapsible, context-menu, dialog, dropdown-menu, hover-card, input, label, lucide-icon, menubar, popover, progress, radio-group, select, separator, skeleton, switch, tabs, text, textarea, toggle, toggle-group, tooltip, native-only-animated-view. |
| Motion tokens | `src/constants/motion.ts`: press-in 110 ms, press-out 200 ms, enter 280 ms, stagger 45 ms, ease-out curve. | Kept. |
| Press feedback | `PressableScale`: Reanimated scale-down on press (0.97) used by buttons, rows and options. | Kept. |
| Screen transitions | Native stack `slide_from_right`, 300 ms, `animationMatchesGesture`, `gestureEnabled` (edge swipe back on iOS). | Kept. |
| Entering animations | Reanimated `FadeIn`, `SlideInDown`, `Layout`, `withSpring`, `withTiming`, `withDelay`, `withSequence`, with `ReduceMotion` respected. | Kept where the kept screens use them; the funnel screens bring the rest back. |
| Gestures | `GestureHandlerRootView` wraps the app; the template's gestures are press gestures and native-stack swipe-back. There are no custom pan or swipe gestures in upstream. | Kept. Custom gestures are added per screen (see `docs/SCREENS.md` in an app). |
| Haptics | `expo-haptics` selection feedback on each onboarding step. | Package kept; the call returns with the funnel. |
| Gradients | `expo-linear-gradient` backgrounds and rings. | Kept. |

### 1.3 Packages and native configuration

Upstream runtime packages (43): Expo SDK 57 (`expo ~57.0.21`), React 19.2, React Native 0.86.3,
Expo Router (typed routes), React Compiler, Reanimated 4 with `react-native-worklets`, Gesture Handler 3,
Safe Area Context, Screens, SVG, `react-native-web`, TanStack Query, Zustand, Supabase JS,
`react-native-url-polyfill`, AsyncStorage, `@react-native-picker/picker`, RevenueCat
(`react-native-purchases`, `react-native-purchases-ui`), PostHog (`posthog-react-native`,
`@posthog/react-native-plugin`), and the Expo modules apple-authentication, application, constants,
crypto, dev-client, device, file-system, font, glass-effect, haptics, linear-gradient, linking,
localization, notifications, router, secure-store, splash-screen, status-bar, symbols, system-ui,
updates, web-browser.

Upstream config plugins: `expo-router`, `expo-splash-screen`, `expo-web-browser`,
`expo-apple-authentication`, `expo-secure-store` (Face ID text), `expo-localization`, and three local
plugins: `with-inhibit-pod-warnings`, `with-disable-script-sandboxing`, `with-ios-scene-lifecycle`.

Upstream tooling: TypeScript, oxlint (type-aware, with react-doctor and accessibility plugins), oxfmt,
knip, lefthook, Ultracite, `expo-atlas` bundle analysis (`analyze`, `export:size` scripts),
`scripts/setup-eas-env.sh`, `scripts/setup-revenuecat.sh`, GitHub CI, `docs/perf-playbook.md`.

### 1.4 What the owned template changed

Removed from upstream: the onboarding funnel, the custom and hosted paywall screens, `zustand`,
`@react-native-picker/picker`, `src/lib/json.ts`.

Added to upstream:

- NativeWind 4 with Tailwind tokens generated from the project plan's theme, and 32 React Native
  Reusables (shadcn) components.
- Expo SQLite with Drizzle ORM as the offline source of truth (`src/data`), behind an `ItemRepository`
  interface.
- React Hook Form with Zod for forms.
- Device modules preinstalled: camera, image picker, document picker, clipboard, sharing, network state.
- Boundaries `src/core/api` (HTTP client) and `src/core/device` (`DeviceTransport` for BLE, sockets
  and mocks).
- The Android long-path plugin `with-android-cmake-path-limit` (from LUMNI).
- Feature switches (`src/constants/features.ts`) and the `start.sh feature` command.
- Launch, device and verification scripts from LUMNI; documents `ARCHITECTURE.md`,
  `CAPABILITIES.md`, `SCREENS.md`, `TESTING.md`, `FEATURES.md`.

## 2. Switch reference

Run these from the builder root; `APP` is the generated app's folder.

```bash
bash start.sh expo feature list                     # every feature and what it supports
bash start.sh expo feature status APP               # on, off, removed, added
bash start.sh expo feature off analytics APP        # soft switch (or inside the app: bash start.sh feature off analytics)
bash start.sh expo feature on analytics APP
bash start.sh expo feature remove payments APP      # hard remove, then bun install
bash start.sh expo feature add payments APP         # put it back exactly
bash start.sh expo feature add funnel APP           # add the upstream onboarding funnel and full paywall
```

Options for `remove` and `add`: `--no-install` skips `bun install` (the next `bash start.sh setup` in
the app refreshes the lockfile once), and `--force` overrides the safety check described below.

| Feature | Switch | Remove deletes | Packages uninstalled (only if unused elsewhere) | Also changes |
| --- | --- | --- | --- | --- |
| `auth` | yes | `src/lib/supabase.ts`, `src/lib/secure-storage.ts`, `src/types/database.ts`, `supabase/`; stubs for the auth API, session hook and sign-in screen (redirects to Home) | `@supabase/supabase-js`, `react-native-url-polyfill`, `expo-apple-authentication`, `expo-crypto`, `expo-secure-store`, `expo-web-browser`, AsyncStorage | `ios.usesAppleSignIn`, Supabase variables, CI job `edge-functions` |
| `payments` | yes | paywall screen and API, RevenueCat UI adapters, `src/lib/storage.ts`, `src/lib/guards.ts`, `scripts/setup-revenuecat.sh`; stubs for entitlement (always free), RevenueCat sync, paywall route (redirects to Home) | `react-native-purchases`, `react-native-purchases-ui`, AsyncStorage | RevenueCat variables |
| `analytics` | yes | stub for `src/lib/analytics.tsx` (every call becomes a no-op) | `posthog-react-native`, `@posthog/react-native-plugin`, `expo-application`, `expo-file-system` | PostHog variables |
| `notifications` | yes | `src/lib/notifications.ts`; stub for the notification-intent hook | `expo-notifications` | none |
| `local-db` | no | `src/data/`; stub for the home repository (in-memory list) | `expo-sqlite`, `drizzle-orm`, `drizzle-kit` | none |
| `device-kit` | no | nothing (no template code uses these modules) | `expo-camera`, `expo-image-picker`, `expo-document-picker`, `expo-clipboard`, `expo-sharing`, `expo-network` | none |
| `ota-updates` | no | nothing | `expo-updates` | removes `runtimeVersion`, sets `updates.enabled: false` |
| `funnel` (add) | no | on remove, restores the files it replaced | adds `zustand`, `@react-native-picker/picker` | adds 70 files and the `0002_onboarding_funnel.sql` migration, replaces 7 files (splash gate, brand, content, paywall route and screen, storage, database types) |

Rules the tool enforces:

- `funnel` needs `auth`, `payments`, `analytics` and `notifications` present; those cannot be removed
  while the funnel is added.
- "add" refuses to overwrite a stub that was edited after removal, or a file that reappeared at a
  deleted path; removing the funnel refuses when its files were edited. Merge by hand or use `--force`.
- After `add funnel`, edit the onboarding questions, copy and graphs in `src/features/onboarding` and
  `src/constants/content.ts`; they describe a demo product. Apply the migration with the Supabase CLI.
- Every change is recorded in the app's `.mobile-builder/features.json`; commit that folder with the app.

Features can also be chosen at creation time in the project plan:

```json
"features": { "remove": ["payments", "device-kit"], "off": ["analytics"], "add": [] }
```

## 3. Choosing

| Goal | Suggested set |
| --- | --- |
| Internal or offline tool, no accounts | remove `auth`, `payments`, `analytics`; keep `local-db` |
| Free consumer app with accounts | remove `payments`; keep `auth`, `analytics`, `notifications` |
| Subscription consumer app with a conversion funnel | keep all, `add funnel` |
| Hardware companion app (the LUMNI pattern) | keep all, add capabilities `ble`, `audio-speech`, `camera-vision` |
| Prototype for a demo | switch `auth`, `payments`, `analytics` off (no keys needed); remove later |

The choice depends on the product; these rows are starting points, not recommendations.

## 4. Verification

`node --test _expo/tests/features.test.mjs` checks the manifest against the template, that every
stub exports only names the original exports, and that removing every feature and adding it back (and
adding and removing the funnel) restores an app byte for byte. `bash start.sh verify --full` also
generates an app, installs it, removes every feature, runs typecheck, lint, format, knip and unit tests,
adds everything back plus the funnel, and runs them again. All of these passed on 2026-10-23. Native
builds after a removal were not run; after removing a feature with config plugins, rebuild the
development client (`bash start.sh run dev-client` in the app).
