import { useEffect } from "react";
import { useLocalSearchParams } from "expo-router";

import { captureEvent } from "@/lib/analytics";

import PaywallScreen from "./paywall-screen";

export default function PaywallRoute() {
  const { context = "preview" } = useLocalSearchParams<{ context?: string }>();
  useEffect(
    () => captureEvent("paywall_viewed", { context: context === "gate" ? "gate" : "upsell" }),
    [context],
  );
  return <PaywallScreen />;
}
