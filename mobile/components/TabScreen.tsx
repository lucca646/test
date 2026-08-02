import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { useAppTheme } from "../lib/theme";

type Props = {
  kicker?: string;
  title: string;
  body: string;
  tint: [string, string];
  children?: ReactNode;
  /** Masque la carte “Barre officielle Apple” en bas */
  hideFooter?: boolean;
};

/** Contenu d’onglet — nav = dock split JS (layout parent). */
export default function TabScreen({
  kicker = "CORAIA · GLASS",
  title,
  body,
  tint,
  children,
  hideFooter = false,
}: Props) {
  const theme = useAppTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <StatusBar style={theme.statusBar} />
      <LinearGradient
        colors={theme.backgroundGradient}
        style={StyleSheet.absoluteFill}
      />
      <View
        style={[styles.blob, styles.blobBlue, { backgroundColor: theme.blobBlue }]}
      />
      <View
        style={[
          styles.blob,
          styles.blobOrange,
          { backgroundColor: theme.blobOrange },
        ]}
      />

      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient colors={tint} style={styles.hero}>
          <Text style={styles.kicker}>{kicker}</Text>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
        </LinearGradient>

        {children}

        {!hideFooter ? (
          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              Mode {theme.isDark ? "nuit" : "jour"} · système
            </Text>
            <Text style={[styles.cardBody, { color: theme.textMuted }]}>
              L’UI suit Réglages → Affichage et luminosité. Dock split
              gauche/droite (même modèle que la webapp) + blur adaptatif.
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { padding: 16, paddingBottom: 110, gap: 16 },
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
    borderWidth: StyleSheet.hairlineWidth,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardBody: {
    fontSize: 14,
    lineHeight: 22,
  },
  blob: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    opacity: 0.9,
  },
  blobBlue: {
    top: 40,
    left: -40,
  },
  blobOrange: {
    top: 80,
    right: -60,
  },
});
