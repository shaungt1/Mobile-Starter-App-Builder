# Changelog

## 2026-09-18 — operational starter workflow

### Added

- `AGENT_START.md` with discovery questions, staged gates, dependency policy, security rules, Git
  ownership rules, release safety, and a definition of done.
- `AGENTS.md` as the conventional repository entry point that routes agents to `AGENT_START.md`.
- `QUICKSTART.md` covering automated bootstrap, existing-project setup, manual setup, runtime choices,
  environment variables, capabilities, verification, release commands, and troubleshooting.
- `start.sh` command router and `scripts/startup/` automation for host checks, bootstrap, identity
  configuration, dependency setup, verification, development surfaces, capability installation, and
  guarded EAS releases.
- `config/capabilities.json`, an opt-in package/service catalog derived from the working LUMNI stack.
- `code/env.example`, a generic client configuration contract.
- `docs/TEMPLATE_ADOPTION_PLAN.md`, the staged plan for owning a maintained in-house template instead
  of relying indefinitely on the upstream repository.

### Changed

- Reframed the README around the actual operator and agent workflows.
- Genericized the reusable host report and MMKV identifier so copied code no longer says `LUMNI` or
  writes to a LUMNI-specific storage namespace.
- Clarified that package/runtime versions must be read from the cloned template and lockfile rather
  than assumed from a permanently frozen SDK description.

### Audit findings

- The playbook previously had no agent entry point, no quick-start document, no reusable setup/release
  scripts, no capability manifest, no changelog, and no template-adoption plan.
- Its `code/check-system.mjs` and `code/kv.ts` still contained product-specific LUMNI labels.
- The LUMNI reference confirms the value of capability flags, zero-config mock paths, secure chunked
  auth storage, EAS profiles, system/config/device checks, guarded release scripts, and store-readiness
  documentation.
- A live bootstrap smoke test against upstream commit `888b9e131bdab4354c2bff7ea1fb744667269b10`
  confirmed that source attribution, Git detachment, new `main` initialization, and app identity
  configuration work as documented.
- The same upstream snapshot initially failed Expo Doctor because 22 Expo packages lagged the SDK's
  expected patch set. Fresh bootstrap now runs the official `expo install --fix` compatibility step;
  existing projects must opt in with `setup --fix-expo`.
- Expo's fixer also identified a missing `expo-font` config plugin that it could not write through the
  template's dynamic `app.config.js`. Setup now repairs that known baseline plugin in `app.json` before
  invoking the official compatibility fix.
- Bun retained duplicate nested Expo modules after the patch upgrade, which Expo Doctor correctly
  rejected. The opt-in fix path now removes only the target's derived `node_modules` directory and
  performs a clean frozen-lockfile reinstall before verification. Cleanup uses a path-validating,
  retrying Node helper so Bun hardlinks can be removed reliably on Windows.
- The upstream template's `.mts` Oxlint configuration requires Node 20.19.x or 22.18+, while the
  September 2026 Supabase client line has dropped Node 20. Setup and the host report therefore require
  Node 22.18+ even though upstream's package manifest currently says only `>=20` and `.nvmrc` says `22`.
- A Windows clone converted the upstream source to CRLF and caused `oxfmt --check` to reject 147 files
  because upstream does not include `.gitattributes`. Bootstrap now disables clone-time line-ending
  conversion and installs a generic `.gitattributes` policy in the independent app.
- Current Supabase guidance was incorporated: publishable/legacy anon keys are client-safe but secret
  and service-role keys are not; Data API grants are separate from RLS; exposed tables need ownership
  policies; authorization must not trust user-editable metadata; and native Apple/Google flows require
  provider/dashboard plus development-build verification.
- SQLite + Drizzle is listed in LUMNI but its own database guide is explicitly a placeholder; this
  playbook therefore presents it as an opt-in capability, not as a falsely completed integration.
- ElectricSQL is not implemented in LUMNI. It remains a deliberate design/integration step rather than
  a blind package install.

### Verification performed for this change

- Shell syntax checks for every `.sh` file.
- JSON parsing for the capability catalog.
- Node syntax checks for helper scripts.
- Read-only host report execution.
- Git diff whitespace/error checks.
- Live upstream bootstrap with provenance, Git detachment, identity replacement, and LF validation.
- Generated-app validation under temporary Node 22.18: Expo Doctor 21/21, TypeScript, Oxlint,
  Oxfmt, and Knip all passed after the scripted compatibility repairs.

Runtime app verification is performed against each generated target because this repository itself is
documentation and automation, not an Expo application.
