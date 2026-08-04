import { useEffect } from "react";
import { Stack } from "expo-router";
import { useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import AppErrorBoundary from "../components/AppErrorBoundary";
import { CurrentUserProvider } from "../src/messages/CurrentUserContext";
import { applyOtaUpdateIfAny } from "../lib/ota";
import { useColors } from "../src/theme";

/**
 * Stack racine — contient le groupe `(tabs)` (Messages/Stats/Profil/Paramètres)
 * et le fil de conversation `thread/[key]` en dehors des onglets, pour que la
 * barre d'onglets native disparaisse pendant la lecture d'une conversation
 * (comme dans l'app Messages d'Apple).
 */
export default function RootLayout() {
  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  const scheme = useColorScheme();
  const c = useColors();
  const isDark = scheme !== "light";

  const navTheme = isDark
    ? {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: c.accent,
          background: c.bg,
          card: c.card,
          text: c.text,
          border: c.border,
        },
      }
    : {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: c.accent,
          background: c.bg,
          card: c.card,
          text: c.text,
          border: c.border,
        },
      };

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: c.bg }}>
      <AppErrorBoundary label="Root">
        <CurrentUserProvider>
          <StatusBar style={c.statusBar} />
          <ThemeProvider value={navTheme}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen
                name="thread/[key]"
                options={{
                  headerShown: true,
                  title: "",
                  headerTintColor: c.accent,
                  headerStyle: { backgroundColor: c.bg },
                  headerShadowVisible: false,
                }}
              />
            </Stack>
          </ThemeProvider>
        </CurrentUserProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
