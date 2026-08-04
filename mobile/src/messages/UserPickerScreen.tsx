import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KNOWN_USERS, useCurrentUser } from "./CurrentUserContext";
import { avatarColor, initials } from "./format";
import { useColors } from "../theme";

/** Sélection d'identité — pas de mot de passe pour l'instant : un clic suffit. */
export default function UserPickerScreen() {
  const { selectUser } = useCurrentUser();
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: c.bg, paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
        <Text style={styles.icon}>💬</Text>
      </View>
      <Text style={[styles.title, { color: c.text }]}>Messages</Text>
      <Text style={[styles.sub, { color: c.muted }]}>Qui es-tu ?</Text>

      <View style={styles.list}>
        {KNOWN_USERS.map((u) => (
          <Pressable
            key={u.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              selectUser(u.id);
            }}
            style={({ pressed }) => [
              styles.row,
              { backgroundColor: c.card, opacity: pressed ? 0.8 : 1 },
            ]}
          >
            <View style={[styles.avatar, { backgroundColor: avatarColor(u.id) }]}>
              <Text style={styles.avatarText}>{initials(u.name)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: c.text }]}>{u.name}</Text>
              <Text style={[styles.role, { color: c.muted }]}>
                {u.role === "admin" ? "Administrateur" : "Vendeur"}
              </Text>
            </View>
            <Text style={[styles.chevron, { color: c.chevron }]}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, paddingHorizontal: 24 },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  icon: { fontSize: 30 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: -0.6, textAlign: "center" },
  sub: { fontSize: 15, textAlign: "center", marginTop: 4, marginBottom: 28 },
  list: { gap: 12 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 14,
    padding: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  name: { fontSize: 17, fontWeight: "600" },
  role: { fontSize: 13, marginTop: 1 },
  chevron: { fontSize: 22 },
});
