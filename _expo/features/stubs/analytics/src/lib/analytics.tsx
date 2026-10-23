/**
 * Stub: the analytics feature was removed. Every function keeps its name and does nothing,
 * so screens can keep calling captureEvent. Re-add PostHog with the builder's `feature add analytics`.
 */
import type { ReactNode } from "react";

import type { AnalyticsEventName, AnalyticsEvents } from "@/lib/analytics-events";

type PersonProperties = Record<string, string | number | boolean | null>;

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  return children;
}

export function ScreenTracker() {
  return null;
}

export function identifyUser(_userId: string, _properties?: PersonProperties): void {}

export function resetUser(): void {}

export function captureEvent<E extends AnalyticsEventName>(
  _event: E,
  ..._properties: AnalyticsEvents[E] extends undefined ? [] : [properties?: AnalyticsEvents[E]]
): void {}

export function registerSuperProperties(_properties: PersonProperties): void {}

export function setPersonProperties(_properties: PersonProperties): void {}

export function analyticsDistinctId(): string | undefined {
  return undefined;
}

export function analyticsOptedOut(): boolean {
  return true;
}

export async function setAnalyticsOptOut(_optedOut: boolean): Promise<void> {}
