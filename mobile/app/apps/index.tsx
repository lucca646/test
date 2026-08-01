import { Pressable, StyleSheet, Text, View } from "react-native";
import { type Href, router } from "expo-router";
import TabScreen from "../../components/TabScreen";
import DeviceLab from "../../components/apps/DeviceLab";
import { useAppTheme } from "../../lib/theme";

export default function AppsTab() {
  const theme = useAppTheme();

  return (
    <TabScreen
      title="Apps"
      body="Zone de test : Face ID, caméra/flash, notifications. UI adaptative clair/sombre."
      tint={["#34d399", "#059669"]}
      hideFooter
    >
      <Pressable
        onPress={() => router.push("/apps/atelier" as Href)}
        style={({ pressed }) => [
          styles.entry,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        <View style={{ flex: 1, gap: 4 }}>
          <Text style={[styles.entryKicker, { color: "#34d399" }]}>
            NOUVELLE PAGE · OTA
          </Text>
          <Text style={[styles.entryTitle, { color: theme.text }]}>
            Atelier Island Kit
          </Text>
          <Text style={[styles.entryBody, { color: theme.textMuted }]}>
            Catalogue des layouts natifs — sans rebuild de la barre.
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </Pressable>

      <DeviceLab />
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  entry: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 18,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
  },
  entryKicker: {
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  entryTitle: {
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  entryBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  chevron: {
    fontSize: 28,
    fontWeight: "300",
    color: "#34d399",
    marginTop: -2,
  },
});
