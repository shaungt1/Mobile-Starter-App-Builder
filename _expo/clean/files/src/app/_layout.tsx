import "../../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

/** Root providers: gestures, safe areas and the stack navigator. Add routes as files in src/app. */
export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
