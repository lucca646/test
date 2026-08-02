import { useEffect } from "react";
import {
  NativeTabs,
  Icon,
  Label,
} from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { NAV_TINT } from "app-nav";
import AppErrorBoundary from "../components/AppErrorBoundary";
import { AuthProvider } from "../src/auth/AuthContext";
import { applyOtaUpdateIfAny } from "../lib/ota";
import { colors } from "../src/theme";

/**
 * Architecture OTA-stable (= binaire TestFlight) :
 * NativeTabs TOUJOURS à la racine — jamais Stack/(auth) qui démonte UITabBar.
 * Auth gérée dans chaque écran via AuthGate.
 */
export default function RootLayout() {
  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: NAV_TINT, dark: NAV_TINT })
      : NAV_TINT;

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.bg }}>
      <AppErrorBoundary label="Root">
        <AuthProvider>
          <StatusBar style="light" />
          <ThemeProvider value={DarkTheme}>
            <NativeTabs
              tintColor={tint}
              labelStyle={{ fontSize: 10, fontWeight: "600" }}
              blurEffect="systemMaterialDark"
              disableTransparentOnScrollEdge
            >
              {/* index.tsx redirige coralt:/// → /entreprises (pas un onglet) */}
              <NativeTabs.Trigger name="index" hidden>
                <Label> </Label>
                <Icon sf="building.2" />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="entreprises">
                <Label>Entreprises</Label>
                <Icon
                  sf={{ default: "building.2", selected: "building.2.fill" }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="recherche" role="search">
                <Label>Recherche</Label>
                <Icon sf="magnifyingglass" />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="envois">
                <Label>Envois</Label>
                <Icon
                  sf={{
                    default: "rectangle.stack",
                    selected: "rectangle.stack.fill",
                  }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="parametres">
                <Label>Profil</Label>
                <Icon
                  sf={{
                    default: "person.crop.circle",
                    selected: "person.crop.circle.fill",
                  }}
                />
              </NativeTabs.Trigger>
            </NativeTabs>
          </ThemeProvider>
        </AuthProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
