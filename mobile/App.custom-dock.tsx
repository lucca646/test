import { useState } from "react";
import { StyleSheet, Text, View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import LiquidGlassDock, { type DockTab } from "./components/LiquidGlassDock";

/**
 * @deprecated Entrée Expo Go expérimentale — NE PAS diverger du catalogue.
 * Production iOS = NativeTabs / UITabBar via app-nav (`mobile/app/_layout.tsx`).
 * Pour tester le dock custom, dériver depuis `visibleTabs()` + `tab.ion`.
 */
const TABS: DockTab[] = [
  { id: "today", label: "Aujourd'hui", icon: "today-outline", iconActive: "today" },
  { id: "games", label: "Jeux", icon: "rocket-outline", iconActive: "rocket" },
  { id: "apps", label: "Apps", icon: "layers-outline", iconActive: "layers" },
  {
    id: "arcade",
    label: "Arcade",
    icon: "game-controller-outline",
    iconActive: "game-controller",
  },
  { id: "search", label: "Recherche", icon: "search", iconActive: "search" },
];

const COPY: Record<string, { title: string; body: string; tint: [string, string] }> = {
  today: {
    title: "Aujourd'hui",
    body: "Playground Expo — même dock Liquid Glass que la PWA, testable sans App Store via Expo Go.",
    tint: ["#3b82f6", "#1d4ed8"],
  },
  games: {
    title: "Jeux",
    body: "Glisse la pastille sur la barre. Au drag elle grossit et devient plus transparente.",
    tint: ["#fb923c", "#ea580c"],
  },
  apps: {
    title: "Apps",
    body: "Blur natif (expo-blur) + gestures Reanimated — plus proche d’iOS que le web Safari.",
    tint: ["#34d399", "#059669"],
  },
  arcade: {
    title: "Arcade",
    body: "Pas de store : Expo Go scanne le QR, ou `npx expo start --tunnel`.",
    tint: ["#a78bfa", "#7c3aed"],
  },
  search: {
    title: "Recherche",
    body: "Look validé : inset au repos, overflow -0.28rem au drag, bleu #0a84ff sous la lentille.",
    tint: ["#94a3b8", "#475569"],
  },
};

function Screen({ tabId }: { tabId: string }) {
  const page = COPY[tabId] ?? COPY.today;
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient colors={page.tint} style={styles.hero}>
        <Text style={styles.kicker}>EXPO · LIQUID GLASS</Text>
        <Text style={styles.heroTitle}>{page.title}</Text>
        <Text style={styles.heroBody}>{page.body}</Text>
      </LinearGradient>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Sans App Store</Text>
        <Text style={styles.cardBody}>
          1. Installe Expo Go sur ton iPhone{"\n"}
          2. Dans mobile/ : npx expo start --tunnel{"\n"}
          3. Scanne le QR avec l’appareil photo / Expo Go
        </Text>
      </View>
    </ScrollView>
  );
}

export default function App() {
  const [tab, setTab] = useState("today");

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <View style={styles.root}>
          <StatusBar style="light" />
          <LinearGradient
            colors={["#161625", "#050508"]}
            style={StyleSheet.absoluteFill}
          />
          {/* wallpaper blobs */}
          <View style={[styles.blob, styles.blobBlue]} />
          <View style={[styles.blob, styles.blobOrange]} />
          <View style={[styles.blob, styles.blobMint]} />

          <SafeAreaView style={styles.safe} edges={["top"]}>
            <Screen tabId={tab} />
          </SafeAreaView>

          <LiquidGlassDock tabs={TABS} activeId={tab} onChange={setTab} />
        </View>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050508" },
  safe: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    padding: 16,
    paddingBottom: 120,
    gap: 16,
  },
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
  heroTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  heroBody: {
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
    opacity: 0.45,
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
  blobMint: {
    bottom: 180,
    right: 40,
    backgroundColor: "rgba(52,211,153,0.45)",
  },
});
