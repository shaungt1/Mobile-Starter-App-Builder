# KEEL — Cross-Platform Expo Mobile Starter Playbook

> **Location.** This is the Expo section of Mobile Starter App Builder. Commands below run from this
> `_expo/` folder (`cd _expo`), or from the repository root as `bash start.sh expo <command>`. The
> quickest path is the guided root command `bash start.sh new --platform expo`.

*(KEEL = the backbone a ship is built on. Rename the stack freely; the structure is what matters.)*

---

## Overview

This document is a **repeatable setup guide for building a new cross-platform (iOS + Android) mobile
application** using a proven Expo + React Native foundation. It exists so a developer — or an AI agent —
can take one base repository, turn it into a brand-new app, install only the right tools, apply the
fixes we already discovered, and reach a **fully working, themed, batteries-included foundation before a
single product screen is designed.**

It is deliberately ordered. You do **not** start building screens first. You:

1. **Section 1 — Set up the repo:** fork the base template, detach it from its original GitHub project,
   install the foundation packages, wire the UI system, choose Expo Go vs a Development Build, and
   **confirm the empty app actually runs.**
2. **Section 2 — Define the theme:** answer a fixed set of brand/color questions and apply them, so the
   look-and-feel is locked before screens exist.
3. **Section 3 — Build screens, APIs, and logic:** only after the foundation and theme are confirmed.
4. **Appendix — Package/service reference:** categorized tables of proven packages to pull from as the
   app needs them. Some are installed during Section 1; the rest are on-demand.

The goal: hand this to a developer/agent, point them at a new project name, and get a running, themed
app foundation **without repeating the setup pain** — every known pitfall is flagged where it belongs.

---

## Important information (read before you start)

A few facts decide everything downstream. Read this section first.

- **This is a stack, not an app.** You fork a base repo and convert it into *your own* application. You
  are not contributing to the original project, so its Git history and GitHub wiring are removed
  (Section 1.2).
- **There are two ways to run an Expo app, and they are not equal:**
  - **Expo Go** — a pre-made app you install from the store; scan a QR and your app appears. **It only
    runs apps that use the standard Expo SDK.** The moment you add custom native modules (Bluetooth,
    camera vision, Skia, MMKV, on-device AI), Expo Go **cannot** run them.
    Reference: https://expo.dev/go
  - **Development Build** — your *own* build of the app that includes your native modules. Build it once,
    install it, then it hot-reloads exactly like Expo Go. **Required for any app with custom native
    modules.** Reference: https://docs.expo.dev/develop/development-builds/introduction/
- **Decide Expo Go vs Development Build on day one** (Section 1.7). If the app needs hardware/native
  features, it is a Development Build app — plan for it early instead of fighting Expo Go later.
- **Confirm the foundation runs before building screens.** The most expensive mistake is installing many
  packages and building many screens *before ever launching the app*; then every runtime issue surfaces
  at once. Install incrementally and verify after each step (Section 1 gates).
- **A `code/` folder ships with this playbook** containing drop-in files (environment guard, storage
  guard, NativeWind config, etc.) referenced throughout. Copy them into new projects to save time.

---

## Base repository

The stack is founded on one MIT-licensed template that already includes working authentication,
subscriptions, analytics, notifications, and CI. The table below is the source you fork.

| Field | Value |
|---|---|
| **Name** | expo-app-template (Simonstorms) |
| **URL** | https://github.com/Simonstorms/expo-app-template |
| **License** | MIT — free to use commercially; keep `LICENSE`, add a `NOTICE` crediting the source |
| **Framework** | Audit snapshot: Expo SDK 57, React Native 0.86, React 19, expo-router, TypeScript. Read the cloned `package.json` and lockfile for the current source of truth. |
| **Package manager** | **bun** (npm-equivalent; faster) — https://bun.sh |
| **Run type** | **Development-build template** — optional native modules require a Dev Build; guarded core/demo paths may also run in Expo Go or web |

**What the repo already includes (batteries):**

- Full **authentication** flow + session handling (Supabase), with auth screens.
- **Subscriptions/paywall** scaffolding (RevenueCat), feature-flag-off capable.
- **Analytics** (PostHog) and **error/crash** wiring points (Sentry-ready).
- **Notifications** permission + handling scaffolding.
- **Navigation shell**: tab navigator, stacks, modals, typed routes (expo-router).
- **Theming** provider (light/dark), **i18n** scaffolding, **forms** patterns.
- **EAS** build config (`eas.json`) and GitHub Actions for typecheck/lint.
- A **demo product** (example screens) that exercises all of the above.

**Capability-flag design:** every backend integration is gated behind a flag, so the app still runs a
full demo with an **empty `.env`**. Nothing hard-crashes when a key is missing. Preserve this.

---

## Section 1 — Repository setup, migration & staging

This section takes you from "clone" to "a running, themed-ready foundation." Do the steps in order and
run the verification gate at the end of each before moving on.

### 1.1 Prerequisites (host toolchain)

Install these before touching the repo. Only the last three are needed if you will make a Development
Build; the first three are always required.

| Tool | Required for | Install |
|---|---|---|
| **Node 22+** | everything | nvm / winget |
| **bun** | package install + scripts | `npm i -g bun` |
| **git** | version control | — |
| **@expo/ngrok** | tunnel URL so a phone reaches the dev server on any network | `bun add -d @expo/ngrok` |
| **Java 17 (Temurin)** | Android Development Build only | `winget install EclipseAdoptium.Temurin.17.JDK` |
| **Android Studio + SDK 34+ + NDK + 1 emulator image** | local Development Build only | `winget install Google.AndroidStudio` |
| **EAS CLI** | cloud Development Build only | `npm i -g eas-cli` |

> **Disk note:** a working Android Studio + SDK + NDK + emulator + build caches needs roughly
> **25–30 GB**; have **40 GB+ free** or install to a secondary drive. An Android emulator wants **8 GB+ RAM**.
>
> **Platform note:** commands here use Windows `winget`; on **macOS** use Homebrew (`brew`) and also
> install **Watchman**; on **Linux** use your package manager. **iOS builds require a Mac with Xcode** —
> on Windows/Linux, build iOS in the cloud with EAS.

### 1.2 Generate an independent application

Use the owned local template for normal work. The generator refuses a non-empty target, applies one
identity/theme plan, records upstream provenance, and initializes an independent `main` branch.

```bash
cp starter/project-plan.example.json ../my-plan.json
# Edit the plan.
bash start.sh create <your-app-folder> --plan ../my-plan.json --install
cd <your-app-folder>
```

Use `bash start.sh bootstrap ...` only when you deliberately need a new clone of the preserved upstream
project. Direct clones require detaching upstream Git metadata and removing the product demo manually.

**Make it your own project.** Create a fresh, empty GitHub repo for your app, point Git at it, and make
the first commit so the fork becomes a permanent, independent project:

```bash
git remote add origin <your-new-repo-url>
git add . && git commit -m "chore: initial app from starter stack"
```

**Secrets hygiene (do not skip):** never commit secrets. Confirm `.env`, token files (`*.pat`, `*.txt`
tokens), and local key files are listed in `.gitignore`. Keep API keys and EAS/access tokens **outside**
the repo (a local git-ignored folder or a secrets manager), never in source.

### 1.3 Set your application identity

Give the app its own identity so it's a distinct project, not the template.

- In `app.json`: set `name`, `slug`, `scheme`, iOS `bundleIdentifier`, Android `package`
  (e.g. `com.yourcompany.app`), and `version`.
- **Do not add `newArchEnabled`** — New Architecture is default in SDK 57 and the key fails the schema.

### 1.4 Install dependencies and confirm the clean baseline

Install the template's own dependencies first and prove the untouched app is healthy before adding
anything.

```bash
bun install
bunx expo-doctor        # if it reports DUPLICATE native modules: rm -rf node_modules bun.lock && bun install
bun pm trust --all      # bun blocks postinstall scripts by default; trust them
bun run typecheck
bun run lint
```

**Gate:** expo-doctor clean, typecheck 0, lint 0. Commit this as your starting point.

**Environment variables (`.env`):** copy the template's `.env.example` to `.env`. You can leave it
**empty to run the full demo** (capability flags handle missing keys), or fill in what you have — e.g.
Supabase URL + anon key for auth, and provider API keys for cloud AI. Keep `.env` out of Git.

```bash
cp .env.example .env
```

### 1.5 Install the always-needed foundation packages

Every app on this stack wants the same UI/interaction foundation. Install it now (skip anything already
present in the template). These are the minimum to build screens later.

```bash
# Styling + design system
bun add nativewind class-variance-authority clsx tailwind-merge tailwindcss-animate
bun add -d tailwindcss@^3.4.17 prettier-plugin-tailwindcss
bun add lucide-react-native
# Interaction foundation (native modules the template usually already has — verify, don't duplicate)
bunx expo install react-native-reanimated react-native-gesture-handler react-native-safe-area-context react-native-screens react-native-svg expo-system-ui expo-navigation-bar
```

> **Rule:** use `bunx expo install <pkg>` for anything Expo manages (it pins the SDK-correct version);
> use `bun add <pkg>` for pure-JS packages. This prevents version drift (see Section 4).

### 1.6 Wire the UI system (NativeWind + React Native Reusables)

NativeWind gives you Tailwind classes; React Native Reusables gives you owned, accessible components.
Drop in the config files from this playbook's `code/` folder, then add components.

- Copy from `code/`: `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css`, `cn.ts`
  (→ `src/lib/cn.ts`). Import `global.css` once in the root layout.
- NativeWind docs: https://www.nativewind.dev · React Native Reusables: https://reactnativereusables.com
- Add components with the CLI (create `components.json` first; **do not run `init` on an existing app**):

```bash
bunx @react-native-reusables/cli@latest add button card input dialog select switch <others> -y -o --styling-library nativewind
```

### 1.7 Choose Expo Go vs Development Build (and add the guard)

This decision controls how you'll run the app while building. Add the environment guard now regardless —
it lets the same code run on web, Expo Go, and a Development Build.

**Add the guard files** (from `code/`): `environment.ts` and `kv.ts` → `src/lib/`. The rule they enforce:
**never import a native-only module at the top of a file that must run on web/Expo Go — load it lazily
behind `hasNativeModules`, with a fallback.** Apply the same pattern to any native service (analytics,
purchases, notifications, system-UI, haptics).

**Option A — Expo Go (fast, limited).** Use only if the app stays within the standard Expo SDK. Guard
every native-only call so it no-ops on web/Expo Go. Run:

```bash
bunx expo start            # press s to switch to Expo Go, scan the QR
bunx expo start --tunnel   # if same-Wi-Fi fails; uses @expo/ngrok for a public URL
```

Expo Go reference: https://expo.dev/go

**Option B — Development Build (full features, required for native modules).** Build once, then iterate
with Metro like Expo Go. Local or cloud:

```bash
# Local (needs Android Studio/Java): builds to emulator or a USB device with Developer Mode on
bunx expo prebuild && bunx expo run:android
# Cloud (no local Android tooling; needs a free Expo account + token):
eas login && eas build -p android --profile development
```

Development Build reference: https://docs.expo.dev/develop/development-builds/introduction/ ·
EAS token: https://expo.dev/settings/access-tokens

> **Hard limits to state up front:** Expo Go cannot run custom native modules. Emulators cannot do
> Bluetooth or a real camera. A **locked/managed phone** (no Developer Mode, no sideloading) cannot run
> **any** Development Build — use **web** for UI and a **spare unlocked phone** for hardware.

### 1.8 A web preview surface (optional but recommended)

For fast UI/theme/flow review with zero installs — and it even works on a locked phone's browser — run
the app on web. Native-only calls must be guarded (Section 1.7) or web will error.

```bash
bunx expo start --web      # open http://localhost:8081 (or http://<your-LAN-IP>:8081 on a phone browser)
```

### 1.9 What works, what doesn't, what to clean up

Be explicit with yourself about the inherited app so nothing surprises you later.

| Included feature | Works in Expo Go | Works in Dev Build | Notes |
|---|---|---|---|
| UI, navigation, theming, forms | ✅ | ✅ | keep |
| Supabase auth | ✅ (JS/fetch) | ✅ | add your project keys in `.env` |
| Cloud AI (OpenAI/Anthropic via fetch) | ✅ | ✅ | keys in secure storage, never in bundle |
| PostHog analytics | usually ✅ | ✅ | gated by flag; guard if it misbehaves |
| RevenueCat, notifications push, BLE, camera, Skia, MMKV, on-device AI | ❌ | ✅ | native — guard for web/Expo Go |

Clean-up candidates once your app takes shape: the template's **demo screens/routes** (they can crash
Expo Go via native imports and clutter the route tree), unused fonts, and unused capability flags.

### 1.10 Verification gate (must pass before Section 2)

Confirm the foundation actually runs — this is the checkpoint the whole method depends on.

- `bunx expo-doctor` clean · `bun run typecheck` 0 · `bun run lint` 0
- App launches and is navigable on your chosen surface (web, Expo Go, or Dev Build).
- No red errors on startup. **Do not proceed to screens until this passes.**

---

## Section 2 — Theme setup & planning

Before any screen is designed, lock the visual identity. The developer answers (or the agent collects
from the developer) the questions below, then the answers are applied to the design tokens in
`global.css` and `tailwind.config.js`, and confirmed with a live light/dark switch.

**Questions to answer (all of them):**

- **Primary color** (the main brand/action color)?
- **Secondary color**?
- **Tertiary / accent color(s)**?
- **Semantic colors** — success, warning, danger — or use defaults?
- **Neutral/surface tone** — pure grey, or warm/cool tinted? Near-black background value?
- **Gradients** — any, and which color stops?
- **Style language** — flat, glassmorphism, neumorphism, high-contrast? Elevation via shadow or surface
  lightness?
- **Default theme** — dark, light, or follow-system?
- **Typography** — interface font and (if a reading/content app) a content font; any accessibility font?
- **Radius & spacing feel** — sharp, rounded, pill?
- **Brand references** — logo, existing palette, screenshots, or artwork to sample from?

**Apply & confirm:** map answers to CSS variables in `global.css` (light + dark) and to the Tailwind
color tokens; verify the theme renders and the light/dark toggle works. Only then move on.

---

## Section 3 — Screens, APIs & logic

With a running foundation and a locked theme, build the product. Keep this phase modular and mock-first;
do not wire real backends/hardware before the screens exist and render.

- **Reuse what's already there.** The template ships a tab bar and basic screens (home, settings,
  onboarding, auth, paywall). Revamp them to your brand or replace as needed rather than starting blank.
- **Build reusable modules, not one-off screens.** A single config-driven list screen, one settings
  engine, and one bottom-sheet host collapse dozens of screens into a few components.
- **Mock-first.** Feed screens from a `mocks/` layer and a mock data source so the whole UI is clickable
  before any database/API/hardware exists; swap in real services behind the same hooks later.
- **AI integration.** Cloud LLMs/VLMs (OpenAI/Anthropic/Grok) are just network calls and work on every
  surface, including web/Expo Go; on-device models (llama.rn/ONNX) and camera OCR require a Development
  Build. Keep AI behind a small provider interface so you can swap cloud/local without touching screens.
- **APIs & logic last.** Once screens render with mock data, wire the database (Drizzle + SQLite),
  auth/sync (Supabase), and any device transports.

Pull any additional packages you need from the Appendix. Install them one category at a time and re-run
the verification gate after each.

---

## Section 4 — Known issues to watch for (what to look for, and where)

These are the traps we hit. Each line names the symptom and where to look — enough for the next
developer/agent to recognize and locate it fast.

- **App won't run in Expo Go / "undefined is not a function" on startup:** the template's native module
  versions are newer than Expo Go's. Check `node_modules/expo/bundledNativeModules.json` for the exact
  versions Expo Go ships; either match them or use a Development Build.
- **`expo-notifications` crash in Expo Go:** push was removed from Expo Go (SDK 53+). Any route/screen
  importing it breaks startup because Expo Router loads all routes. Guard it (native-only).
- **Reanimated errors:** reanimated and `react-native-worklets` must be a compatible pair. Pin them and
  add to `expo.install.exclude` so `expo install --fix` and `^` ranges don't drift them apart.
- **Blank/white screen:** a startup provider threw, or the root layout is gated on fonts. Guard native
  startup services; render even if fonts fail (timeout fallback).
- **Web errors ("… not available on web"):** a native call ran during web render. Guard it via the
  environment module (see `code/environment.ts`); common offenders: `colorScheme.set`, `expo-system-ui`,
  `expo-haptics`, `expo-notifications`.
- **"Route missing default export" warnings:** usually a route module crashed on load (a native import),
  not a real export problem — fix the crash; also prefer explicit `export default` over re-exports; the
  experimental React Compiler can add noise (toggle in `app.json` experiments).
- **MMKV:** v4 is Nitro-based — use `createMMKV()`, not `new MMKV()`; delete a key with `.remove()`.
- **React Native Reusables `add`:** overwrites same-named files (e.g. the template's `icon.tsx`). Diff
  before overwriting; keep both by renaming.
- **bun:** blocks postinstall scripts by default → `bun pm trust`.
- **jest:** SDK 57 wants **jest 29**, not 30.
- **expo-doctor New-Arch warnings** (tcp-socket, udp, track-player, webrtc, some OCR): add to
  `expo.doctor.reactNativeDirectoryCheck.exclude` if accepted; validate on a real device.

---

## Appendix — Package / service reference

These are proven-working packages and services grouped by purpose. **Install only what your app needs.**
The foundation ones (Styling/UI, Navigation, Animation, Gestures) are installed in Section 1; the rest
are on-demand. **Keep these tables updated** as you adopt or retire packages, so the list stays a
reliable, coherent menu for future apps.

### A. Styling & UI
The visual system: Tailwind-in-RN plus owned components and icons.

| Package | What it's for |
|---|---|
| `nativewind` + `tailwindcss@3` | Tailwind utility classes via `className` |
| `class-variance-authority`, `clsx`, `tailwind-merge` | component variants + class merging (`cn()`) |
| `tailwindcss-animate` | enter/exit animation utilities |
| `lucide-react-native` | icon set |
| React Native Reusables + `@rn-primitives/*` | accessible, owned components (dialogs, selects, etc.) |

### B. Navigation
File-based routing and screen containers.

| Package | What it's for |
|---|---|
| `expo-router` | file-based routes, typed routes, modals |
| `react-native-screens`, `react-native-safe-area-context` | native screen perf + safe areas |

### C. Animation & rendering
Native-thread animation and 2D graphics.

| Package | What it's for |
|---|---|
| `react-native-reanimated` + `react-native-worklets` | 60fps animation on the native thread |
| `moti` | declarative animation over Reanimated |
| `lottie-react-native`, `rive-react-native` | vector / state-machine animations |
| `@shopify/react-native-skia` | custom 2D canvas/graphics (native) |

### D. Gestures, haptics & sheets
Touch response and interaction surfaces.

| Package | What it's for |
|---|---|
| `react-native-gesture-handler` | native gestures |
| `expo-haptics` | haptic feedback |
| `@gorhom/bottom-sheet` | bottom sheets |
| `react-native-keyboard-controller` | keyboard-synced UI |
| `react-native-pager-view`, `react-native-draggable-flatlist` | paging + reorderable lists |

### E. Lists, menus & feedback
High-performance lists, native menus, and toasts.

| Package | What it's for |
|---|---|
| `@shopify/flash-list` | fast recycling list |
| `zeego` + `@react-native-menu/menu` + `react-native-context-menu-view` | native context/dropdown menus |
| `sonner-native` | toast notifications |

### F. State & forms
App state, state machines, server cache, and validated forms.

| Package | What it's for |
|---|---|
| `zustand` | lightweight UI/global state |
| `xstate` + `@xstate/react` | finite state machines for complex flows |
| `@tanstack/react-query` | server-state cache + mutations |
| `react-hook-form` + `@hookform/resolvers` + `zod` | forms + schema validation |
| `react-native-mmkv` | fast synchronous storage (native; v4 = `createMMKV`) |

### G. Local database
On-device SQL with typed queries and migrations.

| Package | What it's for |
|---|---|
| `expo-sqlite` | on-device SQLite |
| `drizzle-orm` + `drizzle-kit` | typed queries + migrations (https://orm.drizzle.team) |
| `expo-drizzle-studio-plugin` | inspect the DB during development |

### H. Networking & IoT
Connectivity to devices, sockets, and message brokers.

| Package | What it's for |
|---|---|
| `react-native-ble-plx` | Bluetooth Low Energy (native; Dev Build only) |
| `expo-network`, `react-native-zeroconf` | network info + local service discovery |
| `react-native-tcp-socket`, `react-native-udp` | raw sockets |
| `mqtt` | IoT pub/sub messaging |
| `@craftzdog/react-native-buffer`, `react-native-quick-base64`, `react-native-quick-crypto`, `protobufjs` | binary/crypto/encoding helpers |

### I. Camera & vision
Camera capture and on-device text/image recognition.

| Package | What it's for |
|---|---|
| `react-native-vision-camera` + `react-native-worklets-core` | high-performance camera + frame processors |
| `@react-native-ml-kit/text-recognition` | on-device OCR |
| `expo-camera`, `expo-image`, `expo-image-manipulator`, `expo-media-library` | camera, images, edits, library |

### J. Audio & speech
Playback, text-to-speech, and speech recognition.

| Package | What it's for |
|---|---|
| `expo-speech` | text-to-speech (works on web too) |
| `expo-audio`, `react-native-track-player` | audio session + lock-screen playback |
| `expo-speech-recognition`, `react-native-audio-api` | speech-to-text + audio analysis |

### K. Artificial intelligence
Cloud and on-device model access plus orchestration.

| Package | What it's for |
|---|---|
| `openai`, `@anthropic-ai/sdk`, `ai` | cloud LLM/VLM clients + streaming |
| `langchain` + `@langchain/core` + `@langchain/langgraph` + `@langchain/openai` + `@langchain/anthropic` | multi-step AI orchestration |
| `llama.rn`, `onnxruntime-react-native` | on-device models (Dev Build only) |
| `js-tiktoken` | token counting/budgeting |

### L. Security, storage & files
Secrets, biometrics, and file operations.

| Package | What it's for |
|---|---|
| `expo-secure-store`, `expo-local-authentication`, `expo-crypto` | encrypted storage, biometrics, crypto |
| `react-native-get-random-values`, `react-native-url-polyfill` | required polyfills for crypto/URL |
| `expo-file-system`, `expo-document-picker`, `expo-sharing`, `expo-clipboard`, `expo-print` | files, import, share, print |
| `react-native-markdown-display`, `react-native-qrcode-svg` | markdown rendering + QR codes |

### M. Fonts, i18n & notifications
Typography, localization, and background/notifications.

| Package | What it's for |
|---|---|
| `expo-font` + `@expo-google-fonts/*` | custom fonts |
| `i18next` + `react-i18next` + `intl-pluralrules` | localization |
| `expo-notifications`, `expo-background-task`, `expo-task-manager` | notifications + background work (Dev Build for push) |

### N. Observability & commerce
Crash/analytics and subscriptions.

| Package | What it's for |
|---|---|
| `@sentry/react-native` | crash + error reporting |
| `posthog-react-native` | product analytics |
| `react-native-purchases` | subscriptions (RevenueCat; native) |

### O. Dev & testing / tooling
Testing and developer utilities.

| Package | What it's for |
|---|---|
| `jest` (29) + `jest-expo` + `@testing-library/react-native` + `@testing-library/jest-native` | unit/component tests |
| `msw` | network mocking in tests |
| `reactotron-react-native` | dev-time inspection |
| `@expo/ngrok` | dev-server tunnel (`expo start --tunnel`) |

### Services (accounts/config)
External services the app can use; most have free tiers.

| Service | For | Link |
|---|---|---|
| EAS (Expo) | cloud builds + OTA updates | https://expo.dev/settings/access-tokens |
| Supabase | auth + database + storage | https://supabase.com |
| OpenAI / Anthropic | cloud AI | provider dashboards |
| Sentry / PostHog | crash + analytics | respective dashboards |
| RevenueCat | subscriptions | https://www.revenuecat.com |

---

## Automation entry points

Use [`QUICKSTART.md`](QUICKSTART.md) for the human workflow or [`AGENT_START.md`](AGENT_START.md) for
the required agent sequence. `bash start.sh help` lists the executable commands. The automation can
bootstrap a detached app, configure its identity, install and verify an existing app, start each Expo
runtime surface, install one optional capability at a time, and perform guarded EAS releases.

Optional capabilities and their runtime/configuration requirements live in
[`config/capabilities.json`](config/capabilities.json). The catalog is a menu, not a default install
list.

---

## Reusable code files (`code/` folder)

These drop-in files implement the patterns above; copy them into a new project's matching paths.

| File | Drop into | Purpose |
|---|---|---|
| `environment.ts` | `src/lib/` | detect Expo Go vs web vs Dev Build (`hasNativeModules`) |
| `kv.ts` | `src/lib/` | synchronous storage that uses MMKV natively, memory fallback on web/Expo Go |
| `cn.ts` | `src/lib/` | Tailwind class-merge helper |
| `haptics.ts` | `src/…/` | haptics helper, guarded for web/Expo Go |
| `babel.config.js`, `metro.config.js`, `tailwind.config.js`, `global.css` | project root | NativeWind wiring + design tokens |
| `check-system.mjs` | `scripts/` | reports host specs + emulator/AI feasibility (`node scripts/check-system.mjs`) |
| `env.example` | `.env.example` | generic client-visible environment contract; server secrets are deliberately excluded |
| `gitattributes` | `.gitattributes` | stable LF source/shell endings across Windows, macOS, and Linux |

---

## Reference links

- Expo: https://docs.expo.dev · Expo Router: https://docs.expo.dev/router/introduction/
- Expo Go: https://expo.dev/go · Development Builds: https://docs.expo.dev/develop/development-builds/introduction/
- EAS Build: https://docs.expo.dev/build/introduction/ · EAS tokens: https://expo.dev/settings/access-tokens
- NativeWind: https://www.nativewind.dev · React Native Reusables: https://reactnativereusables.com
- Drizzle: https://orm.drizzle.team · bun: https://bun.sh
