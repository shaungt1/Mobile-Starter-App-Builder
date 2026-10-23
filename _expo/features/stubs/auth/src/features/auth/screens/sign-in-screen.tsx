import { Redirect } from "expo-router";

/** Stub: the auth feature was removed; the sign-in route sends people to the app. */
export default function SignInScreen() {
  return <Redirect href="/(tabs)/home" />;
}
