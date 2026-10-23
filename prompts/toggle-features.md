# Prompt: switch off, remove or add Expo template features

Paste into an agent opened on this builder repository. Replace the bracketed parts.

```text
Read AGENT_START.md, then _expo/docs/FEATURES.md and the skill .claude/skills/mobile-features.
App folder: [path to the generated Expo app]
For that app:
- switch off (keep code): [for example analytics]
- remove completely (code and native packages): [for example payments, device-kit]
- add back or add: [for example funnel]
Show `bash start.sh expo feature status` before and after, run `bash start.sh verify` in the app,
and report what changed, what still needs a development-client rebuild, and any dashboard or
backend clean-up I should do by hand. Do not use --force without asking me.
```

For a new app, put the same choices in the project plan instead:

```json
"features": { "off": ["analytics"], "remove": ["payments", "device-kit"], "add": [] }
```
