import { Pressable, StyleSheet, Text, View } from "react-native";
import { Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { API_URL } from "../../src/config";
import { colors } from "../../src/theme";

export default function ParametresScreen() {
  const { user, activated, logout } = useAuth();
  if (!activated) return <Redirect href="/(app)/recherche" />;

  return (
    <View style={styles.wrap}>
      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <Text style={styles.value}>{user?.name || "—"}</Text>
        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user?.email || "—"}</Text>
        <Text style={styles.label}>Plan</Text>
        <Text style={styles.value}>{Number(user?.plan) || 1}</Text>
        <Text style={styles.label}>Gmail</Text>
        <Text style={styles.value}>
          {user?.gmail_connected ? "Connecté" : "Non connecté"}
        </Text>
        <Text style={styles.label}>API</Text>
        <Text style={styles.value}>{API_URL}</Text>
      </View>

      <Pressable style={styles.btn} onPress={() => logout()}>
        <Text style={styles.btnText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 16 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 6,
  },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", marginTop: 8 },
  value: { color: colors.text, fontSize: 16 },
  btn: {
    backgroundColor: "rgba(255,69,58,0.85)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
