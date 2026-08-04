import { useEffect } from "react";
import {
  NativeTabs,
  Icon,
  Label,
} from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform, useColorScheme } from "react-native";
import { StatusBar } from "expo-status-bar";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  ThemeProvider,
  DarkTheme,
  DefaultTheme,
} from "@react-navigation/native";
import { NAV_TINT } from "app-nav";
import AppErrorBoundary from "../components/AppErrorBoundary";
import { AuthProvider } from "../src/auth/AuthContext";
import { applyOtaUpdateIfAny } from "../lib/ota";
import { useColors } from "../src/theme";

/**
 * NativeTabs racine — Accueil (plan du jour) en premier.
 * Recherche hors barre (accessible depuis Accueil).
 */
export default function RootLayout() {
  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  const scheme = useColorScheme();
  const c = useColors();
  const isDark = scheme !== "light";

  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: NAV_TINT, dark: NAV_TINT })
      : NAV_TINT;

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
        <AuthProvider>
          <StatusBar style={c.statusBar} />
          <ThemeProvider value={navTheme}>
            <NativeTabs
              tintColor={tint}
              labelStyle={{ fontSize: 10, fontWeight: "600" }}
              blurEffect={c.tabBlur}
              disableTransparentOnScrollEdge
            >
              <NativeTabs.Trigger name="index" hidden>
                <Label> </Label>
                <Icon sf="house" />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="accueil">
                <Label>Accueil</Label>
                <Icon
                  sf={{ default: "house", selected: "house.fill" }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="envois">
                <Label>Envois</Label>
                <Icon
                  sf={{
                    default: "paperplane",
                    selected: "paperplane.fill",
                  }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="messages">
                <Label>Messages</Label>
                <Icon
                  sf={{ default: "message", selected: "message.fill" }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="entreprises">
                <Label>Liste</Label>
                <Icon
                  sf={{ default: "building.2", selected: "building.2.fill" }}
                />
              </NativeTabs.Trigger>

              {/* Recherche hors barre — push depuis Accueil */}
              <NativeTabs.Trigger name="recherche" hidden>
                <Label>Recherche</Label>
                <Icon sf="magnifyingglass" />
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
