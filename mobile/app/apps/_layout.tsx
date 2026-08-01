import { Stack } from "expo-router";
import { useAppTheme } from "../../lib/theme";

/**
 * Stack dans l’onglet Apps — permet de pousser des pages
 * (ex. /apps/atelier) sans toucher à la UITabBar (5 onglets).
 */
export default function AppsStackLayout() {
  const theme = useAppTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.isDark ? "#0B0B0F" : "#F2F2F7",
        },
        headerTintColor: "#0a84ff",
        headerTitleStyle: {
          fontWeight: "700",
          color: theme.text,
        },
        contentStyle: {
          backgroundColor: theme.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen
        name="atelier"
        options={{
          title: "Atelier",
          headerBackTitle: "Apps",
        }}
      />
    </Stack>
  );
}
