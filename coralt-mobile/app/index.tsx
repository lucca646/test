import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "../src/auth/AuthContext";
import { colors } from "../src/theme";

export default function Index() {
  const { user, authReady, activated } = useAuth();

  if (!authReady) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (!user) return <Redirect href="/(auth)/login" />;
  if (!activated) return <Redirect href="/(app)/recherche" />;
  return <Redirect href="/(app)/entreprises" />;
}
