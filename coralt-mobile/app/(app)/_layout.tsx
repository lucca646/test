import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import { hasEnvoisAccess } from "../../src/utils/planAccess";
import { colors } from "../../src/theme";
import CoraltGlassTabBar from "../../src/ui/CoraltGlassTabBar";
import { GLASS_DOCK_CONTENT_INSET } from "../../src/ui/LiquidGlassDock";

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

  return (
    <Tabs
      tabBar={(props) => <CoraltGlassTabBar {...props} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700" },
        sceneStyle: {
          backgroundColor: colors.bg,
          paddingBottom: GLASS_DOCK_CONTENT_INSET,
        },
      }}
    >
      <Tabs.Screen
        name="entreprises"
        options={{
          title: "Entreprises",
          href: activated ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="recherche"
        options={{
          title: "Recherche",
        }}
      />
      <Tabs.Screen
        name="envois"
        options={{
          title: "Envois",
          href: activated && envois ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: "Profil",
          href: activated ? undefined : null,
        }}
      />
    </Tabs>
  );
}
