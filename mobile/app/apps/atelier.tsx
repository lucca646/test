import { ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { LAYOUT_CATALOG, type IslandLayout } from "../../lib/islandKit";
import { useAppTheme } from "../../lib/theme";

const ORDER: IslandLayout[] = [
  "score",
  "transport",
  "music",
  "timer",
  "focus",
  "breathe",
  "dual",
  "sides",
  "minimal",
  "progress",
  "default",
];

export default function AtelierPage() {
  const theme = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient
        colors={theme.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView contentContainerStyle={styles.content}>
        <LinearGradient colors={["#5E5CE6", "#0A84FF"]} style={styles.hero}>
          <Text style={styles.kicker}>CORAIA · PAGE EMPILÉE</Text>
          <Text style={styles.title}>Atelier</Text>
          <Text style={styles.body}>
            Page ajoutée dans le stack Apps — pas un nouvel onglet. Livrable en
            OTA, sans rebuild de la UITabBar.
          </Text>
        </LinearGradient>

        <Text style={[styles.section, { color: theme.textMuted }]}>
          LAYOUTS PRÊTS DANS LE BINAIRE
        </Text>

        {ORDER.map((key) => {
          const item = LAYOUT_CATALOG[key];
          return (
            <View
              key={key}
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.cardLabel, { color: theme.text }]}>
                  {item.label}
                </Text>
                <Text style={styles.cardKey}>{key}</Text>
              </View>
              <Text style={[styles.cardDesc, { color: theme.textMuted }]}>
                {item.description}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 40, gap: 10 },
  hero: {
    borderRadius: 24,
    padding: 22,
    minHeight: 150,
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  kicker: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  body: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  section: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1.1,
    marginTop: 8,
    marginBottom: 2,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
  cardKey: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0a84ff",
    fontVariant: ["tabular-nums"],
  },
  cardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
});
