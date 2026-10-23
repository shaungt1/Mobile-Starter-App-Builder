---
name: mobile-troubleshoot
description: Diagnose a failing builder command, setup, verify, native build or app launch for Expo or Tauri apps. Use whenever a command exits non-zero or an app does not start.
---

# Troubleshoot

## Steps
1. Re-read the full error output; identify the first failing command.
2. Search `docs/LESSONS_LEARNED.md` (builder root) for the symptom; many issues are already handled or have a known fix.
3. Run `bash start.sh system` (app) or `bash start.sh doctor` (builder) to rule out missing tools.
4. Change one thing at a time and re-run the failing command; do not mix fixes with feature work.
5. Never fix by committing `node_modules`, `.env`, keystores or tokens, by force-pushing, or by deleting user files.
6. If a new problem is solved, add a row to `docs/LESSONS_LEARNED.md` in the builder (symptom, cause, fix).

## Done when
The failing command passes, or the user has an exact description of the blocker and the options to resolve it.
