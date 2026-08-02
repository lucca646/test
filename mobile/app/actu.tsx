import { StyleSheet, Text, View } from "react-native";
import { ACTU, ACTU_ARTICLES } from "app-nav";
import TabScreen from "../components/TabScreen";
import { useAppTheme } from "../lib/theme";

export default function ActuTab() {
  const theme = useAppTheme();

  return (
    <TabScreen
      kicker={ACTU.kicker}
      title={ACTU.title}
      body={ACTU.body}
      tint={ACTU.tint as [string, string]}
    >
      <View style={styles.list}>
        {ACTU_ARTICLES.map((a) => (
          <View
            key={a.id}
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <View style={styles.meta}>
              <Text style={[styles.source, { color: "#FF9F0A" }]}>
                {a.source}
              </Text>
              <Text style={[styles.dot, { color: theme.textMuted }]}>·</Text>
              <Text style={[styles.cat, { color: theme.textMuted }]}>
                {a.category}
              </Text>
              <Text style={[styles.time, { color: theme.textMuted }]}>
                {a.time}
              </Text>
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{a.title}</Text>
            <Text style={[styles.excerpt, { color: theme.textMuted }]}>
              {a.excerpt}
            </Text>
          </View>
        ))}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    borderRadius: 20,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  meta: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
  },
  source: { fontSize: 12, fontWeight: "800", letterSpacing: 0.2 },
  cat: { fontSize: 12, fontWeight: "600" },
  dot: { fontSize: 12 },
  time: { fontSize: 12, marginLeft: "auto" },
  title: { fontSize: 17, fontWeight: "700", letterSpacing: -0.2 },
  excerpt: { fontSize: 14, lineHeight: 20 },
});
