import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { Database, PlugZap, ShieldCheck, Sparkles } from "lucide-react-native";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { brand } from "@/constants/brand";
import { captureEvent } from "@/lib/analytics";

import { itemRepository } from "../api";

const itemKey = ["local", "items"] as const;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const items = useQuery({ queryKey: itemKey, queryFn: () => itemRepository.list() });
  const addItem = useMutation({
    mutationFn: () => itemRepository.add(`Local item ${(items.data?.length ?? 0) + 1}`),
    onSuccess: async () => queryClient.invalidateQueries({ queryKey: itemKey }),
  });

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{ paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 }}
    >
      <View className="gap-5 px-5">
        <View className="gap-2">
          <Badge className="self-start">OWNED EXPO FOUNDATION</Badge>
          <Text variant="h1">{brand.appName}</Text>
          <Text className="text-muted-foreground">{brand.tagline}</Text>
        </View>

        <Card>
          <CardHeader>
            <CardTitle>Core is ready</CardTitle>
            <CardDescription>
              Start with stable defaults; add native capabilities only when the product needs them.
            </CardDescription>
          </CardHeader>
          <CardContent className="gap-4">
            <Feature
              icon={Sparkles}
              title="Themeable UI"
              body="NativeWind tokens plus reusable accessible primitives."
            />
            <Feature
              icon={Database}
              title="Local-first SQL"
              body="Expo SQLite and Drizzle work without a cloud account."
            />
            <Feature
              icon={ShieldCheck}
              title="Optional services"
              body="Supabase, RevenueCat, and PostHog are inert until configured."
            />
            <Feature
              icon={PlugZap}
              title="Capability recipes"
              body="Camera, files, sensors, BLE, IoT, and sync have explicit install paths."
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Local repository example</CardTitle>
            <CardDescription>{items.data?.length ?? 0} rows stored on this device.</CardDescription>
          </CardHeader>
          <CardContent className="gap-3">
            {(items.data ?? []).slice(0, 3).map((item) => (
              <Text key={item.id}>• {item.title}</Text>
            ))}
            <Button
              disabled={addItem.isPending}
              onPress={() => {
                captureEvent("home_cta_pressed");
                addItem.mutate();
              }}
            >
              <Text>Add local item</Text>
            </Button>
          </CardContent>
        </Card>

        <Button variant="outline" onPress={() => router.push("/paywall?context=upsell")}>
          <Text>Preview paywall route</Text>
        </Button>
      </View>
    </ScrollView>
  );
}

function Feature({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <View className="flex-row gap-3">
      <Icon size={20} className="text-primary" />
      <View className="flex-1">
        <Text className="font-semibold">{title}</Text>
        <Text className="text-sm text-muted-foreground">{body}</Text>
      </View>
    </View>
  );
}
