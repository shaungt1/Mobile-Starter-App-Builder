import * as Haptics from "expo-haptics";
import { Sparkles } from "lucide-react-native";
import { useState } from "react";
import { Platform, ScrollView, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";

/** Starter screen proving NativeWind tokens, Reusables components, Reanimated, icons and haptics. */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [taps, setTaps] = useState(0);

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <Animated.View entering={FadeInDown.duration(300)} className="gap-4 px-5">
        <Badge className="self-start">
          <Text>Clean Expo starter</Text>
        </Badge>
        <Text variant="h1">Ready to build</Text>
        <Card>
          <CardHeader>
            <CardTitle>Foundation installed</CardTitle>
            <CardDescription>NativeWind, React Native Reusables, Reanimated, gestures, SVG and haptics.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            <View className="flex-row items-center gap-2">
              <Sparkles size={18} color="#2563EB" />
              <Text className="text-muted-foreground">Tapped {taps} times</Text>
            </View>
            <Button
              onPress={() => {
                if (Platform.OS !== "web") void Haptics.selectionAsync();
                setTaps((value) => value + 1);
              }}
            >
              <Text>Tap me</Text>
            </Button>
          </CardContent>
        </Card>
      </Animated.View>
    </ScrollView>
  );
}
