---
name: mobile-screens
description: Design and build the screens of a generated mobile app from the plan's screen list, with mock data first, theme tokens, gestures, animation and accessible states. Use after the app verifies and runs.
---

# Build screens

## Steps
1. Read the app's `docs/SCREENS.md` and `PROJECT_PLAN.json`. Make sure the `screens` list is approved.
2. Confirm the theme first: apply colors (`bash start.sh theme`) and check light and dark on one screen.
3. Build one screen at a time: screen component, route, tab entry if needed, typed mock data source.
4. Use the kit already in the app (React Native Reusables on Expo; shadcn/ui or Konsta UI on Tauri), theme tokens instead of raw colors, Reanimated/Motion for animation (respect reduced motion), Gesture Handler / `@use-gesture/react` for gestures.
5. Include loading, empty and error states and accessible labels.
6. `bash start.sh verify` after each screen; view it on web and on one native target.
7. Replace mocks with real services only after all screens render.

## Done when
Every planned screen renders with mock data, passes `verify`, and was viewed on at least one target.
