/** Stub: the auth feature was removed, so there is never a signed-in user. */
type StubUser = { id: string; email?: string | null };

export function useSession(): {
  session: null;
  user: StubUser | null;
  isSignedIn: boolean;
  isLoading: boolean;
} {
  return { session: null, user: null, isSignedIn: false, isLoading: false };
}
