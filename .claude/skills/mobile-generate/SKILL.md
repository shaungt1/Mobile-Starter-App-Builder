---
name: mobile-generate
description: Generate a mobile app from an approved plan into a folder or a new GitHub repository, then set it up and verify it. Use after mobile-intake.
---

# Generate

## Steps
1. Confirm the target is new, empty, or a fresh repository with only `.git`, `.github`, README, LICENSE and ignore files. Never delete files to make room.
2. Run from the builder root:
   `bash start.sh new --platform <p> --plan <plan.json> (--target <folder> | --repo <url> [--target <clone folder>]) --yes`
   Add `--install` to run setup. Add `--commit` for a first commit and `--push` only if the user asked to push.
3. In the app folder: `bash start.sh setup` (if not run by `--install`), then `bash start.sh verify`.
4. If anything fails, switch to mobile-troubleshoot before continuing.
5. Tell the user the app is now a separate project with its own `AGENTS.md`, and should be opened on its own.

## Done when
`verify` passes in the new app (or each failure is explained with its cause).
