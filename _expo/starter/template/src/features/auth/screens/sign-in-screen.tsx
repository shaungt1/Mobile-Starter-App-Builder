import * as AppleAuthentication from "expo-apple-authentication";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { hasSupabase } from "@/constants/config";

import { AuthCancelledError, signInWithApple, signInWithGoogle } from "../api";
import { useSession } from "../hooks/use-session";

export default function SignInScreen() {
  const insets = useSafeAreaInsets();
  const { isSignedIn } = useSession();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) router.replace("/(tabs)/home");
  }, [isSignedIn]);

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      if (!(caught instanceof AuthCancelledError))
        setError("Sign-in failed. Check provider and redirect configuration.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View
      className="flex-1 justify-center bg-background px-5"
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            {hasSupabase
              ? "Authentication is connected to Supabase."
              : "Supabase is not configured; guest mode remains available."}
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3">
          {Platform.OS === "ios" && hasSupabase ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
              cornerRadius={10}
              style={{ height: 48 }}
              onPress={() => void run(signInWithApple)}
            />
          ) : null}
          <Button disabled={busy || !hasSupabase} onPress={() => void run(signInWithGoogle)}>
            <Text>Continue with Google</Text>
          </Button>
          {!hasSupabase ? (
            <Button variant="outline" onPress={() => router.replace("/(tabs)/home")}>
              <Text>Continue in guest mode</Text>
            </Button>
          ) : null}
          {error ? <Text className="text-destructive">{error}</Text> : null}
        </CardContent>
      </Card>
    </View>
  );
}
