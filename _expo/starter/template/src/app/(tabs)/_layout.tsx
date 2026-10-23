import { Redirect, Tabs } from "expo-router";
import { House, Settings } from "lucide-react-native";
import { View } from "react-native";

import { hasRevenueCat, hasSupabase } from "@/constants/config";
import { useSession } from "@/features/auth/hooks/use-session";
import { useEntitlement } from "@/features/paywall/hooks/use-entitlement";

export default function TabsLayout() {
  const session = useSession();
  const entitlement = useEntitlement();
  if ((hasSupabase && session.isLoading) || (hasRevenueCat && entitlement.isLoading)) {
    return <View className="flex-1 bg-background" />;
  }
  if (hasSupabase && !session.isSignedIn) return <Redirect href="/sign-in" />;
  if (hasRevenueCat && !entitlement.isPro) return <Redirect href="/paywall?context=gate" />;

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: "#2563EB" }}>
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, size }) => <House color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Settings color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
