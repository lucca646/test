import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";

type Props = {
  kicker?: string;
  title: string;
  body: string;
  tint: [string, string];
};

/** Contenu d’onglet — la nav est la UITabBar native (layout parent). */
export default function TabScreen({
  kicker = "UITABBAR · NATIVE iOS",
  title,
  body,
  tint,
}: Props) {
  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <LinearGradient colors={["#161625", "#050508"]} style={StyleSheet.absoluteFill} />
      <View style={[styles.blob, styles.blobBlue]} />
      <View style={[styles.blob, styles.blobOrange]} />

      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient colors={tint} style={styles.hero}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </LinearGradient>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Barre officielle Apple</Text>
          <Text style={styles.cardBody}>
            Cette navigation utilise NativeTabs (expo-router) → UITabBarController
            / UITabBar sur iOS. SF Symbols, blur système, comportement natif
            (scroll, minimize, haptics selon l’OS).
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  content: { padding: 16, paddingBottom: 32, gap: 16 },
  hero: {
    borderRadius: 28,
    padding: 22,
    minHeight: 160,
    justifyContent: "flex-end",
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
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  body: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 15,
    lineHeight: 21,
    maxWidth: 320,
  },
  card: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(28,28,30,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  cardTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardBody: {
    color: "rgba(255,255,255,0.78)",
    fontSize: 14,
    lineHeight: 22,
  },
  blob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.4,
  },
  blobBlue: {
    top: 40,
    left: -40,
    backgroundColor: "rgba(56,120,255,0.9)",
  },
  blobOrange: {
    top: 80,
    right: -60,
    backgroundColor: "rgba(255,120,60,0.75)",
  },
});
