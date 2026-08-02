import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AppErrorBoundary from "../components/AppErrorBoundary";
import { AuthProvider } from "../src/auth/AuthContext";
import { colors } from "../src/theme";
import { applyOtaUpdateIfAny } from "../lib/ota";

/**
 * Coraia Glass → réplique iOS COR·ALT.
 * Auth + Stack ; UITabBar native (Liquid Glass iOS 26+) dans (app).
 *
 * ErrorBoundary racine : une exception JS non catchée ne doit pas
 * enchaîner le crash-loop Expo Updates (rollback automatique).
 */
export default function RootLayout() {
  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppErrorBoundary label="Root">
        <AuthProvider>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: colors.bg },
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(app)" />
          </Stack>
        </AuthProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
