import { Alert, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCurrentUser } from "./CurrentUserContext";
import { avatarColor, initials } from "./format";
import { Group, Row, SectionHeader } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";

export default function ProfilScreen() {
  const { user, clearUser } = useCurrentUser();
  const c = useColors();
  const insets = useSafeAreaInsets();
  if (!user) return null;

  const isAdmin = user.role === "admin";

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
        <View
          style={[
            styles.avatar,
            { backgroundColor: avatarColor(user.id), borderColor: c.accent },
          ]}
        >
          <Text style={styles.avatarText}>{initials(user.name)}</Text>
        </View>
        <Text style={[styles.name, { color: c.text }]}>{user.name}</Text>
        <View
          style={[
            styles.rolePill,
            { backgroundColor: isAdmin ? c.pillWarnBg : c.pillBg },
          ]}
        >
          <Text style={[styles.roleText, { color: isAdmin ? c.pillWarnText : c.pillText }]}>
            {isAdmin ? "Administrateur" : "Vendeur"}
          </Text>
        </View>
      </View>

      <SectionHeader title="Compte" />
      <Group>
        <Row
          label="Identifiant"
          icon={{ name: "person-outline", backgroundColor: c.accent }}
          value={user.id}
        />
        <Row
          label="Rôle"
          icon={{ name: "shield-checkmark-outline", backgroundColor: c.warning }}
          value={isAdmin ? "Administrateur" : "Vendeur"}
          last
        />
      </Group>

      <SectionHeader title="Session" />
      <Group>
        <Row
          label="Changer d’utilisateur"
          destructive
          icon={{ name: "swap-horizontal", backgroundColor: c.danger }}
          onPress={() => {
            Alert.alert("Changer d’utilisateur", "Revenir à l’écran de sélection ?", [
              { text: "Annuler", style: "cancel" },
              { text: "Changer", style: "destructive", onPress: () => clearUser() },
            ]);
          }}
          last
        />
      </Group>
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
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    borderWidth: 3,
  },
  avatarText: { color: "#fff", fontSize: 30, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "700" },
  rolePill: {
    marginTop: 4,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  roleText: { fontSize: 13, fontWeight: "600" },
});
