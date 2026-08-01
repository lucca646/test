import { useEffect } from "react";
import {
  NativeTabs,
  Icon,
  Label,
  Badge,
} from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { APP_TABS, NAV_TINT } from "app-nav";
import { useAppTheme } from "../lib/theme";
import { applyOtaUpdateIfAny } from "../lib/ota";

/**
 * UITabBar native — onglets lus depuis packages/app-nav (JS unique web + iOS).
 * Modifier APP_TABS / hidden → OTA des deux côtés.
 */
export default function RootLayout() {
  const theme = useAppTheme();
  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: NAV_TINT, dark: NAV_TINT })
      : NAV_TINT;

  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  return (
    <NativeTabs
      tintColor={tint}
      labelStyle={{
        fontSize: 10,
        fontWeight: "700",
        color: theme.isDark
          ? "rgba(235,235,245,0.72)"
          : "rgba(60,60,67,0.72)",
      }}
      blurEffect={theme.tabBlur}
      disableTransparentOnScrollEdge
    >
      {APP_TABS.map((tab) => (
        <NativeTabs.Trigger
          key={tab.routeName}
          name={tab.routeName}
          role={tab.role as "search" | undefined}
          hidden={Boolean(tab.hidden)}
        >
          <Label>{tab.label}</Label>
          {tab.badge ? <Badge>{tab.badge}</Badge> : null}
          {/* sf symbols typés côté Expo — cast depuis le catalogue partagé */}
          <Icon sf={tab.sf as never} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
