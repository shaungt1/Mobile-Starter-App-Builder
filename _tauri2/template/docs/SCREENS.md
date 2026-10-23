# Adding screens

This guide is the procedure for adding product screens once the app runs. Screens are built against mock
data first, so the whole interface can be clicked through before Rust commands, plugins or a backend
exist.

## Where things go

Each screen is one component in `src/screens/`. With the Vite frontend, a screen becomes reachable by
adding a route in `src/router.tsx`; with the Next.js frontend, by adding `src/app/<route>/page.tsx` that
renders the screen. Tab-bar entries live in `src/lib/nav-items.ts` and both layouts read them.
Navigation inside screens uses `NavLink` and `useAppNavigation` from `src/lib/navigation.tsx`, which
each frontend implements with the same exports, so screens work unchanged on both.

## Procedure

1. List the screens in `PROJECT_PLAN.json` under `screens`: route, purpose, data shown, actions offered.
2. Create `src/screens/<name>.tsx` using components from `src/components/ui/` (shadcn/ui) or, when the
   plan's `ui` is `konsta`, from `konsta/react`. Add new shadcn components with
   `bunx shadcn@latest add <name>` (uses `components.json`).
3. Add the route (Vite: `src/router.tsx`; Next.js: `src/app/<route>/page.tsx`) and, if it is a tab, an
   entry in `src/lib/nav-items.ts`.
4. Feed the screen from a typed function in `src/lib/` or `src/features/<feature>/api.ts` that returns
   mock data now and calls a Rust command or HTTP later, without changing the screen.
5. Use theme tokens (`bg-background`, `text-primary`), Motion for animation (the layout already honors
   reduced motion) and `@use-gesture/react` for gestures; `src/screens/explore.tsx` shows swipe-to-reveal.
6. Add a Vitest test next to the screen (see `src/screens/home.test.tsx` for mocking Rust with `mockIPC`).
7. Run `bash start.sh verify`, then check the screen with `run web` and on one device target.
