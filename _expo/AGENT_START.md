# Agent start: Expo application setup

> **Location.** This is the Expo section of Mobile Starter App Builder. Commands below run from this
> `_expo/` folder (`cd _expo`), or from the repository root as `bash start.sh expo <command>`. The
> quickest path is the guided root command `bash start.sh new --platform expo`.

This is the canonical entry point for an AI agent using this playbook. Read it before running setup,
changing a target app, or proposing dependencies.

## Mission

Create or upgrade an independently owned Expo application quickly without hiding important product,
security, native-runtime, or release decisions. Use this repository as a toolkit and the upstream
template as a licensed source—not as a remote the new application continues to track.

## Read order

1. This file.
2. [`QUICKSTART.md`](QUICKSTART.md).
3. The relevant section of [`expo-app-starter-playbook.md`](expo-app-starter-playbook.md).
4. `config/capabilities.json` only for capabilities the user is considering.
5. The target project's own `AGENTS.md`, README, package manifest, app config, EAS config, env example,
   and Git status before modifying it.

## First conversation: decisions to collect

Ask only for decisions that cannot be safely inferred. Record the answers in the target project.

### Identity and ownership

- App name, slug, URL scheme, organization/reverse-DNS bundle ID, platforms, and repository remote.
- Whether this is a new app generated from `starter/template`, a deliberate direct-upstream bootstrap,
  or an existing Expo app.
- Upstream template ref/commit if reproducibility requires a specific revision.

### Runtime surface

- Web, Expo Go, development build, physical Android/iOS device, emulator/simulator, or a combination.
- Any native requirements: Bluetooth, camera/vision, local AI, background work, purchases, health,
  files, local network, or custom config plugins. Any one of these may require a development build.

### Product services

- Authentication provider(s): Supabase, email, Apple, Google, or another backend.
- Persistence: in-memory/mock, AsyncStorage/MMKV, SQLite + Drizzle, remote Postgres, or offline sync.
- Subscriptions/payments, analytics, crash reporting, notifications, API proxy/edge functions, and
  required third-party dashboards.
- Data sensitivity, deletion/export requirements, privacy disclosures, and age/audience constraints.

### Brand and interface

- Primary, secondary, accent, semantic, neutral, and gradient colors.
- Light/dark/system default, typography, radius/spacing, motion level, and accessibility needs.
- Required screens, navigation structure, reference designs, and whether inherited demo routes stay.

## Required execution sequence

Never collapse these gates into one large unverified change.

1. **Inspect:** confirm Git cleanliness, project instructions, runtime versions, lockfile, scripts,
   environment contract, app identity, and current native modules. Do not overwrite user changes.
2. **Generate or baseline:** for a new app copy `starter/project-plan.example.json`, fill in identity and
   theme, then use `bash start.sh create <app> --plan <plan> --install` (or, when the user wants the newest
   Expo SDK without the owned template's features, `bash start.sh clean <app>`). Use `bootstrap` only when the
   user explicitly wants a fresh upstream clone. For an existing app use `bash start.sh setup <app>`.
   Preserve `LICENSE`/source records and keep generated Git history independent.
3. **Baseline gate:** run `bash start.sh verify <app>`. If the baseline fails, stop feature installs and
   diagnose the baseline first.
4. **Identity and environment:** configure app identifiers and create `.env` from `.env.example`.
   Never place server secrets in `EXPO_PUBLIC_*` values or commit `.env`.
5. **Theme gate:** map the approved palette to tokens, verify light/dark contrast and reduced motion,
   and render a small representative screen before expanding the UI.
6. **Capabilities:** use `bash start.sh capabilities list`, discuss only relevant choices, install one
   capability with `... install <id> <app> --apply`, complete its native/config/dashboard work, and run
   verification before selecting the next.
7. **Product work:** build screens against mocks or typed service interfaces first. Connect real APIs,
   persistence, auth, payments, and hardware incrementally.
8. **Runtime verification:** test web/Expo Go only where supported; test every native capability in a
   development build and hardware-only behavior on a physical device.
9. **Release readiness:** run checks, validate production configuration and privacy/store metadata,
   then use the guarded release command. Publishing and store submission require explicit approval.
10. **Handoff:** report exact commands run, passing/failing gates, enabled capabilities, remaining
    external dashboard tasks, runtime limitations, source commit, Git commit, and push status.

## Dependency policy

- Read `package.json` and the lockfile before adding anything; do not duplicate existing packages.
- Use `bunx expo install` for Expo/native packages so Expo selects SDK-compatible versions.
- Use `bun add` for pure JavaScript packages and `bun add -d` for development-only tools.
- Do not install the entire capability catalog. Each native dependency increases build size, review
  burden, permissions, and upgrade risk.
- Re-run Expo Doctor, typecheck, lint, and tests after each capability. Commit small working stages.
- Confirm current official documentation before changing Expo SDK, React Native, EAS, store, auth,
  payment, privacy, or security configuration; these are time-sensitive.

## Security and environment rules

- `EXPO_PUBLIC_*` values are embedded in the client bundle and are not secrets.
- A Supabase publishable key (or legacy `anon` key) is valid in a client; `service_role` and secret
  keys are never valid in a mobile bundle.
- Provider secret keys belong in a server, edge function, CI/EAS secret, or secrets manager.
- OAuth redirects must agree across the app scheme, app config, backend config, and provider dashboard.
- Store auth sessions in a secure platform store; account deletion must be reachable to signed-in users.
- Enable row-level security and least-privilege policies before using Supabase tables from a client.
- Data API schema exposure/role grants and RLS are separate controls; verify both. Never authorize from
  user-editable `user_metadata`, and give update policies both ownership `USING` and `WITH CHECK` rules.
- Treat generated native folders as derived unless the target project explicitly commits them.

## Git and release safety

- For a new target, record the upstream URL and exact commit in `NOTICE`, remove only the target's
  `.git`, initialize `main`, and add the new remote only after the user supplies it.
- Never delete or rewrite unrelated work. Never force-push unless the user explicitly requests it and
  understands the consequence.
- `release.sh` performs networked, billable, or public actions. Preview/production builds, OTA updates,
  deployments, and store submissions require a confirmation unless the user explicitly supplied
  `--yes` for that exact action.

## Definition of done

The foundation is done when the target has an independent Git history and attribution, deterministic
dependency install, documented environment contract, configured identity, selected (not blanket)
capabilities, passing static/test checks, and a verified launch on the chosen runtime. A cloud build or
store submission is a separate completion gate and must be reported as such.
