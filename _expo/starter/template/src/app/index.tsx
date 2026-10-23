import { Redirect } from "expo-router";

import { hasSupabase } from "@/constants/config";

export default function IndexRoute() {
  return <Redirect href={hasSupabase ? "/sign-in" : "/(tabs)/home"} />;
}
