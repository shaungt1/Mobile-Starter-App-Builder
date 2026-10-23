---
name: mobile-intake
description: Collect the decisions needed to generate a mobile app (Expo or Tauri 2) with Mobile Starter App Builder and write them into a project plan. Use when the user asks for a new mobile app, before running `start.sh new`.
---

# Intake

`AGENT_START.md` in the builder root is the authority; follow it if this skill disagrees.

## Steps
1. Extract every decision the user already stated; never ask for those again.
2. Ask, in one message, only for what is missing:
   - platform: `expo` (owned template with auth, paywall, analytics, local SQL), `expo-clean` (newest Expo SDK, UI foundation only) or `tauri` (Tauri 2, web UI + Rust). If undecided, show the comparison table in `_tauri2/README.md` and let the user choose.
   - app name, bundle ID (reverse-DNS, segments start with a letter), and either a target folder or a new GitHub repository URL;
   - brand colors (primary, accent, background, foreground as HSL triplets, or hex to convert), light/dark default, radius;
   - screens: route, purpose, data shown, actions;
   - capabilities needed now (`bash start.sh expo capabilities list` or `bash start.sh tauri capability list`);
   - Expo owned template only: which built-in features to keep, switch off or remove (auth, payments, analytics, notifications, local-db, device-kit, ota-updates) and whether to add the upstream onboarding `funnel`; see `_expo/docs/FEATURES.md`. Default: keep all, no funnel;
   - Tauri only: frontend `vite` or `nextjs`, UI kit `shadcn` or `konsta` (+ `ios`/`material`), whether Consta UIKit is wanted (`consta-ui` capability).
3. Copy `_expo/starter/project-plan.example.json` or `_tauri2/project-plan.example.json`, fill it, add a `screens` array, and for Expo a `features` object (`{"off": [], "remove": [], "add": []}`) when anything differs from the default.
4. Show the plan and get the user's approval.

## Done when
An approved plan file exists outside the builder repository.
