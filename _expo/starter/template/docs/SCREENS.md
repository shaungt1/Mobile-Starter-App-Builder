# Adding screens

This guide is the procedure a developer or an agent follows to add product screens once the app runs and
the theme is approved. Screens are built against mock data first, so the whole interface can be clicked
through before any backend, database or hardware is connected.

## Where things go

Routes are files in `src/app/` (Expo Router maps the file path to the URL). A route file stays small: it
imports a screen component from `src/features/<feature>/screens/` and renders it. Each feature folder
holds its screens, its hooks (state and orchestration) and its `api.ts` (calls to services or
repositories). Shared building blocks come from `src/components/ui/`, which follows the shadcn/ui API
through React Native Reusables (`Button`, `Card`, `Text`, `Input`, `Dialog`, `Select`, and more).

## Procedure

1. Write the screen list in `PROJECT_PLAN.json` under a `screens` key: route, purpose, data it shows, and
   actions it offers. Confirm it with the product owner before building.
2. For each screen, add `src/features/<feature>/screens/<name>-screen.tsx` and a route file in
   `src/app/` (or `src/app/(tabs)/` for a tab, adding a `Tabs.Screen` entry in `src/app/(tabs)/_layout.tsx`).
3. Feed it from a typed mock in `src/features/<feature>/api.ts` behind the same function names the real
   service will use, so swapping in Supabase, SQLite or a device transport later does not touch the screen.
4. Use theme tokens (`bg-background`, `text-primary`, `rounded-lg`) instead of raw colors, Reanimated for
   motion (respecting reduced motion), and Gesture Handler for gestures.
5. Cover loading, empty and error states, and give every interactive element an accessible label.
6. Run `bash start.sh verify`, then check the screen on web and on one native target.

New components from the shadcn-style catalog can be added with
`bunx @react-native-reusables/cli@latest add <name>`; diff before accepting overwrites of existing files.
