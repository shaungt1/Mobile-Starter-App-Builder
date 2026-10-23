import { Redirect } from "expo-router";

/** Stub: the payments feature was removed; the paywall route sends people to the app. */
export default function PaywallRoute() {
  return <Redirect href="/(tabs)/home" />;
}
