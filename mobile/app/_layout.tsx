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
import { CurrentUserProvider } from "../src/messages/CurrentUserContext";
import { applyOtaUpdateIfAny } from "../lib/ota";
import { useColors } from "../src/theme";

/**
 * NativeTabs racine — app Messages COR·ALT (SMS).
 * Messages → Stats → Profil → Paramètres.
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
        <CurrentUserProvider>
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
                <Icon sf="message" />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="messages">
                <Label>Messages</Label>
                <Icon
                  sf={{ default: "message", selected: "message.fill" }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="stats">
                <Label>Stats</Label>
                <Icon
                  sf={{ default: "chart.bar", selected: "chart.bar.fill" }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="profil">
                <Label>Profil</Label>
                <Icon
                  sf={{
                    default: "person.crop.circle",
                    selected: "person.crop.circle.fill",
                  }}
                />
              </NativeTabs.Trigger>

              <NativeTabs.Trigger name="parametres">
                <Label>Paramètres</Label>
                <Icon
                  sf={{ default: "gearshape", selected: "gearshape.fill" }}
                />
              </NativeTabs.Trigger>
            </NativeTabs>
          </ThemeProvider>
        </CurrentUserProvider>
      </AppErrorBoundary>
    </GestureHandlerRootView>
  );
}
