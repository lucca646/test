import { useEffect, useRef } from "react";
import { useRouter } from "expo-router";
import { NativeTabs, Icon, Label } from "expo-router/unstable-native-tabs";
import { ThemeProvider, DarkTheme } from "@react-navigation/native";
import { ActivityIndicator, DynamicColorIOS, Platform, View } from "react-native";
import { NAV_TINT } from "app-nav";
import { useAuth } from "../../src/auth/AuthContext";
import { hasEnvoisAccess } from "../../src/utils/planAccess";
import { colors } from "../../src/theme";

/**
 * UITabBar Apple via NativeTabs — onglets COR·ALT.
 *
 * Important OTA / native crash :
 * - Ne JAMAIS démonter `<NativeTabs>` après le 1er montage (logout →
 *   spinner/Redirect à la place du UITabBarController = crash fréquent).
 * - Gates auth via `router.replace` ; onglets `hidden` pour le plan.
 * - `recherche` toujours visible (évite focusedIndex = -1).
 * Props alignées sur le layout playground validé (blurEffect, pas minimizeBehavior).
 */
export default function AppTabsLayout() {
  const { user, authReady, activated } = useAuth();
  const router = useRouter();
  const tabsEverMounted = useRef(false);

  useEffect(() => {
    if (!authReady) return;
    if (!user) {
      router.replace("/(auth)/login");
    }
  }, [authReady, user, router]);

  if (authReady && user) {
    tabsEverMounted.current = true;
  }

  // Spinner seulement AVANT le 1er montage NativeTabs (cold entry).
  if (!tabsEverMounted.current && (!authReady || !user)) {
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

  const envois = hasEnvoisAccess(user);
  const tint =
    Platform.OS === "ios"
      ? DynamicColorIOS({ light: NAV_TINT, dark: NAV_TINT })
      : NAV_TINT;

  return (
    <ThemeProvider value={DarkTheme}>
      <NativeTabs
        tintColor={tint}
        labelStyle={{ fontSize: 10, fontWeight: "600" }}
        blurEffect="systemMaterialDark"
        disableTransparentOnScrollEdge
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
