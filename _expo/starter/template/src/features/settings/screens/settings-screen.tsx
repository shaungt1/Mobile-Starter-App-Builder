import { router } from "expo-router";
import { Alert, Linking, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { brand } from "@/constants/brand";
import { hasPostHog, hasRevenueCat, hasSupabase } from "@/constants/config";
import { deleteAccount, signOut } from "@/features/auth/api";
import { useSession } from "@/features/auth/hooks/use-session";

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useSession();
  const removeAccount = () => {
    Alert.alert(
      "Delete account?",
      "This permanently deletes the signed-in user and their cloud profile.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => void deleteAccount() },
      ],
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <View className="gap-5 px-5">
        <View>
          <Text variant="h1">Settings</Text>
          <Text className="text-muted-foreground">{user?.email ?? "Local guest"}</Text>
        </View>
        <Card>
          <CardHeader>
            <CardTitle>Service readiness</CardTitle>
            <CardDescription>
              Each integration stays disabled until its public client configuration is present.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-2">
            <Text>Supabase auth: {hasSupabase ? "configured" : "off"}</Text>
            <Text>RevenueCat paywalls: {hasRevenueCat ? "configured" : "off"}</Text>
            <Text>PostHog analytics: {hasPostHog ? "configured" : "off"}</Text>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Legal and support</CardTitle>
          </CardHeader>
          <CardContent className="gap-3">
            <Button variant="outline" onPress={() => void Linking.openURL(brand.legal.privacyUrl)}>
              <Text>Privacy policy</Text>
            </Button>
            <Button variant="outline" onPress={() => void Linking.openURL(brand.legal.termsUrl)}>
              <Text>Terms of service</Text>
            </Button>
            <Button
              variant="outline"
              onPress={() => void Linking.openURL(`mailto:${brand.legal.supportEmail}`)}
            >
              <Text>Contact support</Text>
            </Button>
          </CardContent>
        </Card>
        {hasSupabase ? (
          <Card>
            <CardHeader>
              <CardTitle>Account</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <Button
                variant="outline"
                onPress={() => void signOut().then(() => router.replace("/sign-in"))}
              >
                <Text>Sign out</Text>
              </Button>
              <Button variant="destructive" onPress={removeAccount}>
                <Text>Delete account</Text>
              </Button>
            </CardContent>
          </Card>
        ) : null}
        <Text className="text-center text-xs text-muted-foreground">
          {brand.appName} {brand.version}
        </Text>
      </View>
    </ScrollView>
  );
}
