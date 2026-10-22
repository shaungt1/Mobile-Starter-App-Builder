/**
 * Phone-first app shell: a top bar, the current screen, and a bottom tab bar,
 * all padded for notches and the home indicator (safe areas). Screens fade and
 * slide in on route changes (Motion); animation is switched off for people who
 * ask their operating system to reduce motion.
 *
 * Navigation comes from @/lib/navigation, which each frontend (Vite or Next.js)
 * implements with the same exports, so this layout works unchanged with both.
 */
import { MotionConfig, motion } from "motion/react";
import type { ReactNode } from "react";
import { APP_NAME } from "@/lib/app-identity";
import { NAV_ITEMS } from "@/lib/nav-items";
import { NavLink, useAppNavigation } from "@/lib/navigation";

export function AppLayout({ children }: { children: ReactNode }) {
  const { pathname } = useAppNavigation();
  const current = NAV_ITEMS.find((item) => item.to === pathname) ?? NAV_ITEMS[0];
  return (
    <MotionConfig reducedMotion="user">
      <div className="flex h-full flex-col">
        <header className="pt-safe sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
          <div className="flex h-12 items-center justify-between px-4">
            <span className="font-semibold">{APP_NAME}</span>
            <span className="text-muted-foreground text-sm">{current.label}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto px-4 py-4">
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: 12 }}
            key={pathname}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </main>
        <nav aria-label="Main" className="pb-safe border-t bg-background">
          <ul className="grid" style={{ gridTemplateColumns: `repeat(${NAV_ITEMS.length}, minmax(0, 1fr))` }}>
            {NAV_ITEMS.map(({ to, label, Icon }) => (
              <li key={to}>
                <NavLink
                  activeClassName="text-primary"
                  className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-muted-foreground text-xs"
                  to={to}
                >
                  <Icon aria-hidden className="size-5" />
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </MotionConfig>
  );
}
