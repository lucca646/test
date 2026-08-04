import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentUser } from "./CurrentUserContext";
import { avatarColor, initials } from "./format";
import { Button, Group, Row, SectionHeader } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";

export default function ProfilScreen() {
  const { user, clearUser } = useCurrentUser();
  const c = useColors();
  const insets = useSafeAreaInsets();
  if (!user) return null;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
      }}
    >
      <Text style={[styles.largeTitle, { color: c.text }]}>Profil</Text>

      <View style={styles.hero}>
        <View style={[styles.avatar, { backgroundColor: avatarColor(user.id) }]}>
          <Text style={styles.avatarText}>{initials(user.name)}</Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>{user.name}</Text>
        <Text style={[styles.role, { color: c.muted }]}>
          {user.role === "admin" ? "Administrateur" : "Vendeur"}
        </Text>
      </View>

      <SectionHeader title="Compte" />
      <Group>
        <Row label="Identifiant" value={user.id} last />
      </Group>

      <View style={styles.pad}>
        <Button
          label="Changer d’utilisateur"
          variant="gray"
          onPress={() => {
            Alert.alert("Changer d’utilisateur", "Revenir à l’écran de sélection ?", [
              { text: "Annuler", style: "cancel" },
              { text: "Changer", onPress: () => clearUser() },
            ]);
          }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  hero: { alignItems: "center", paddingVertical: 20, gap: 4 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  avatarText: { color: "#fff", fontSize: 26, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700" },
  role: { fontSize: 15 },
  pad: { paddingHorizontal: 16, marginTop: 28 },
});
