import { Redirect } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { ActivityIndicator, DynamicColorIOS, Platform, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { hasEnvoisAccess } from "../../src/utils/planAccess";
import { colors } from "../../src/theme";

/**
 * Vraie UITabBar Apple (UITabBarController) via NativeTabs.
 * Sur iOS 26+ compilé avec Xcode 26 → Liquid Glass système.
 * Expo Go = UITabBar native, mais pas le matériau Liquid Glass iOS 26
 * (Expo Go n’est pas buildé avec Xcode 26).
 */
export default function AppTabsLayout() {
  const { user, authReady, activated } = useAuth();

  if (!authReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.bg,
        }}
      >
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (!user) return <Redirect href="/(auth)/login" />;

  const envois = hasEnvoisAccess(user);
  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: "#0a84ff", dark: "#0a84ff" })
      : "#0a84ff";

  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs
        tintColor={tint}
        labelStyle={{ fontSize: 10, fontWeight: "600" }}
        minimizeBehavior="onScrollDown"
      >
        <NativeTabs.Trigger name="entreprises" hidden={!activated}>
          <Label>Entreprises</Label>
          <Icon
            sf={{ default: "building.2", selected: "building.2.fill" }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="recherche" role="search">
          <Label>Recherche</Label>
          <Icon sf="magnifyingglass" />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger
          name="envois"
          hidden={!activated || !envois}
        >
          <Label>Envois</Label>
          <Icon
            sf={{
              default: "rectangle.stack",
              selected: "rectangle.stack.fill",
            }}
          />
        </NativeTabs.Trigger>

        <NativeTabs.Trigger name="parametres" hidden={!activated}>
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
  );
}
