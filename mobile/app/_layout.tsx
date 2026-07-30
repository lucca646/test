import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { DynamicColorIOS, Platform } from "react-native";

/**
 * Vraie barre d’onglets Apple : UITabBar / UITabBarController
 * via expo-router NativeTabs (pas un composant custom).
 */
export default function RootLayout() {
  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: "#0a84ff", dark: "#0a84ff" })
      : "#0a84ff";

  return (
    <NativeTabs
      tintColor={tint}
      labelStyle={{ fontSize: 10, fontWeight: "600" }}
      blurEffect="systemMaterialDark"
      disableTransparentOnScrollEdge
    >
      <NativeTabs.Trigger name="index">
        <Label>Aujourd'hui</Label>
        <Icon sf={{ default: "newspaper", selected: "newspaper.fill" }} />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="games">
        <Label>Jeux</Label>
        {/* rocket absent sur beaucoup d’iOS → flame */}
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
