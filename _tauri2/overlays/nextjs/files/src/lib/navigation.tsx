"use client";
/**
 * Navigation for the Next.js frontend (App Router with next/link). The Vite
 * frontend has a file with the same exports built on TanStack Router, which is
 * how the same layouts and screens run on both frontends.
 */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface NavLinkProps {
  to: string;
  className?: string;
  activeClassName?: string;
  children: ReactNode;
}

export function NavLink({ to, className, activeClassName, children }: NavLinkProps) {
  const active = usePathname() === to;
  return (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(className, active && activeClassName)}
      data-nav={to}
      href={to}
    >
      {children}
    </Link>
  );
}

export function useAppNavigation(): { pathname: string; navigate: (to: string) => void } {
  const pathname = usePathname();
  const router = useRouter();
  return { pathname, navigate: (to) => router.push(to) };
}
