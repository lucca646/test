import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { API_URL } from "../../src/config";
import {
  Button,
  Group,
  Row,
  SectionHeader,
} from "../../src/ui/Apple";
import { colors } from "../../src/theme";
import { userPlan } from "../../src/utils/planAccess";

export default function ParametresScreen() {
  const { user, activated, logout } = useAuth();
  if (!activated) return <Redirect href="/(app)/recherche" />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.name || user?.email || "?").slice(0, 1).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name || "Profil"}</Text>
        <Text style={styles.email}>{user?.email}</Text>
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
        <Row label="API" value={API_URL.replace("https://", "")} last />
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
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { color: "#fff", fontSize: 28, fontWeight: "700" },
  name: { color: colors.text, fontSize: 22, fontWeight: "700" },
  email: { color: colors.muted, fontSize: 15 },
  pad: { paddingHorizontal: 16, marginTop: 28 },
});
