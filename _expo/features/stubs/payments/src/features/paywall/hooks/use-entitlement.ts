/** Stub: the payments feature was removed, so nobody has a paid entitlement and nothing is gated. */
export function useEntitlement(): { isPro: boolean; isLoading: boolean } {
  return { isPro: false, isLoading: false };
}
