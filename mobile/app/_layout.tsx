import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";
import { useAppTheme } from "../lib/theme";

/**
 * Vraie barre d’onglets Apple : UITabBar / UITabBarController
 * via expo-router NativeTabs (pas un composant custom).
 * Blur + teinte suivent le mode clair / sombre système.
 */
export default function RootLayout() {
  const theme = useAppTheme();
  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: "#0a84ff", dark: "#0a84ff" })
      : "#0a84ff";

  return (
    <NativeTabs
      tintColor={tint}
      labelStyle={{
        fontSize: 10,
        fontWeight: "600",
        color: theme.isDark
          ? "rgba(235,235,245,0.6)"
          : "rgba(60,60,67,0.6)",
      }}
      blurEffect={theme.tabBlur}
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Label>Aujourd'hui</Label>
        <Icon sf={{ default: "newspaper", selected: "newspaper.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="games">
        <Label>Jeux</Label>
        <Icon sf={{ default: "flame", selected: "flame.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="apps">
        <Label>Apps</Label>
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

      <NativeTabs.Trigger name="search" role="search">
        <Label>Recherche</Label>
        <Icon sf="magnifyingglass" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
