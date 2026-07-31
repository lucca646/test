import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/auth/AuthContext";
import { hasEnvoisAccess } from "../../src/utils/planAccess";
import { colors } from "../../src/theme";

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
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: "rgba(22,22,24,0.94)",
          borderTopColor: "rgba(84,84,88,0.45)",
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: "rgba(235,235,245,0.45)",
      }}
    >
      <Tabs.Screen
        name="entreprises"
        options={{
          title: "Entreprises",
          href: activated ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="recherche"
        options={{
          title: "Recherche",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="envois"
        options={{
          title: "Envois",
          href: activated && envois ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="albums" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="parametres"
        options={{
          title: "Profil",
          href: activated ? undefined : null,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
