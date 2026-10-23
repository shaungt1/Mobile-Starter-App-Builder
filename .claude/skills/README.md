# Skills

Each folder holds one `SKILL.md` for one job, in the format agent tools use to decide when to load it.
Claude Code loads skills from this `.claude/skills/` folder automatically when the repository is open;
other agents can read the files directly. Every skill defers to the root `AGENT_START.md`.

The table below lists the skills in the order a new-app task uses them.

| Skill | When to use |
| --- | --- |
| `mobile-intake` | Collect decisions and write the project plan. |
| `mobile-host-setup` | Detect the OS and install missing tools, Android SDK and emulator. |
| `mobile-generate` | Generate into a folder or new repository, set up, verify. |
| `mobile-run-device` | Launch on web, Expo Go, emulator, USB phone, iOS Simulator or Tauri desktop. |
| `mobile-capability` | Add one optional feature, then verify and device-test it. |
| `mobile-features` | Switch off, remove or add back an Expo template feature (auth, payments, analytics, notifications, local database, device modules, updates, onboarding funnel). |
| `mobile-screens` | Build the planned screens with mock data first. |
| `mobile-troubleshoot` | Whenever a command fails. |
| `mobile-handoff` | The final report. |
