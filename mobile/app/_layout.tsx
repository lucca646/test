import { useEffect } from "react";
import {
  NativeTabs,
  Icon,
  Label,
  Badge,
} from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useAppTheme } from "../lib/theme";
import { applyOtaUpdateIfAny } from "../lib/ota";
import { mapIosNativeTabs } from "../adapters/iosNativeTabs";

/**
 * UITabBar native Apple — données via adaptateur app-nav → toNativeTriggers.
 * Le chrome reste UIKit ; seul le catalogue JS est partagé.
 */
export default function RootLayout() {
  const theme = useAppTheme();
  const { tint, triggers } = mapIosNativeTabs();
  const tintColor =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: tint, dark: tint })
      : tint;

  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  return (
    <NativeTabs
      tintColor={tintColor}
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
      {triggers.map((tab) => (
        <NativeTabs.Trigger
          key={tab.name}
          name={tab.name}
          role={tab.role}
          hidden={tab.hidden}
        >
          <Label>{tab.label}</Label>
          {tab.badge ? <Badge>{tab.badge}</Badge> : null}
          <Icon sf={tab.sf as never} />
        </NativeTabs.Trigger>
      ))}
    </NativeTabs>
  );
}
