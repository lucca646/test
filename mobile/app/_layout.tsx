import { useEffect } from "react";
import { NativeTabs, Icon, Label, Badge } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useAppTheme } from "../lib/theme";
import { applyOtaUpdateIfAny } from "../lib/ota";

/**
 * Vraie barre d’onglets Apple : UITabBar via NativeTabs.
 * Labels / icônes / teinte / badge = JS → modifiable en OTA (sans rebuild).
 * Morph Liquid Glass custom / remplacer UITabBar = rebuild.
 */
export default function RootLayout() {
  const theme = useAppTheme();
  // Teinte OTA-visible (bleu système → cyan un peu plus clair)
  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: "#64D2FF", dark: "#64D2FF" })
      : "#64D2FF";

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
      <NativeTabs.Trigger name="index">
        <Label>Aujourd'hui</Label>
        <Icon sf={{ default: "sun.max", selected: "sun.max.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="games">
        <Label>Jeux</Label>
        <Icon sf={{ default: "flame", selected: "flame.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="apps">
        <Label>Apps</Label>
        <Badge>OTA</Badge>
        <Icon
          sf={{
            default: "square.stack.3d.up",
            selected: "square.stack.3d.up.fill",
          }}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="arcade">
        <Label>Arcade</Label>
        <Icon
          sf={{ default: "gamecontroller", selected: "gamecontroller.fill" }}
        />
      </NativeTabs.Trigger>

      {/* Recherche retirée de la barre (OTA) — route /search toujours là si besoin */}
      <NativeTabs.Trigger name="search" hidden>
        <Label>Recherche</Label>
        <Icon sf="magnifyingglass" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
