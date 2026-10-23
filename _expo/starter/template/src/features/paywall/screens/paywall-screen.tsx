import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { brand } from "@/constants/brand";
import { hasRevenueCat } from "@/constants/config";

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      className="flex-1 justify-center bg-background px-5"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Card>
        <CardHeader>
          <Badge className="mb-2 self-start">OPTIONAL MONETIZATION</Badge>
          <CardTitle>{brand.proName}</CardTitle>
          <CardDescription>
            {hasRevenueCat
              ? "RevenueCat is configured. Replace this presentation or enable a hosted paywall."
              : "This safe placeholder never attempts a purchase until RevenueCat keys and products are configured."}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          <Text>• Entitlement hook and identity synchronization are wired.</Text>
          <Text>• Restore and customer-center services are retained.</Text>
          <Text>• Store products remain the source of truth for live prices.</Text>
          <Button disabled={!hasRevenueCat}>
            <Text>Unlock Pro</Text>
          </Button>
          <Button variant="ghost" onPress={() => router.back()}>
            <Text>Not now</Text>
          </Button>
        </CardContent>
      </Card>
    </View>
  );
}
