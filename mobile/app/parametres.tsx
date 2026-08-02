import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import AuthGate from "../src/screens/AuthGate";
import { API_URL } from "../src/config";
import { Button, Group, Row, SectionHeader } from "../src/ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";
import { userPlan } from "../src/utils/planAccess";

function ParametresScreen() {
  const { user, activated, logout } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  if (!activated) return <Redirect href="/recherche" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
      }}
    >
      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: c.accent }]}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>
          {user?.name || "Profil"}
        </Text>
        <Text style={[styles.email, { color: c.muted }]}>{user?.email}</Text>
      </View>

      <SectionHeader title="Compte" />
      <Group>
        <Row label="Plan" value={`Plan ${userPlan(user)}`} />
        <Row
          label="Gmail"
          value={user?.gmail_connected ? "Connecté" : "Non connecté"}
        />
        <Row label="Téléphone" value={String(user?.phone || "—")} last />
      </Group>

      <SectionHeader title="Application" />
      <Group>
        <Row label="API" value={API_URL.replace("https://", "")} />
        <Row
          label="Apparence"
          value="Réglages iOS → Affichage"
          last
        />
      </Group>

      <View style={styles.pad}>
        <Button
          label="Se déconnecter"
          variant="destructive"
          onPress={() => {
            Alert.alert("Déconnexion", "Se déconnecter de COR·ALT ?", [
              { text: "Annuler", style: "cancel" },
              {
                text: "Déconnexion",
                style: "destructive",
                onPress: () => logout(),
              },
            ]);
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  hero: { alignItems: "center", paddingVertical: 28, gap: 6 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700" },
  email: { fontSize: 15 },
  pad: { paddingHorizontal: 16, marginTop: 28 },
});

export default function ParametresScreenGate() {
  return (
    <AuthGate>
      <ParametresScreen />
    </AuthGate>
  );
}
