/**
 * Screens and navigation (Vite frontend). Hash history keeps routing inside the
 * single index.html that Tauri serves on every platform. To add a screen:
 * create src/screens/<name>.tsx, add a route here, and add it to NAV_ITEMS in
 * src/lib/nav-items.ts if it belongs in the tab bar.
 */
import { createHashHistory, createRootRoute, createRoute, createRouter, Outlet } from "@tanstack/react-router";
import { AppLayout } from "@/components/app-layout";
import { ExplorePage } from "@/screens/explore";
import { HomePage } from "@/screens/home";
import { SettingsPage } from "@/screens/settings";

function LayoutRoute() {
  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}

const rootRoute = createRootRoute();
const layoutRoute = createRoute({ getParentRoute: () => rootRoute, id: "layout", component: LayoutRoute });
const homeRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/", component: HomePage });
const exploreRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/explore", component: ExplorePage });
const settingsRoute = createRoute({ getParentRoute: () => layoutRoute, path: "/settings", component: SettingsPage });

const routeTree = rootRoute.addChildren([layoutRoute.addChildren([homeRoute, exploreRoute, settingsRoute])]);

export const router = createRouter({ routeTree, history: createHashHistory() });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
