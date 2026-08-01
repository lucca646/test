import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ISLAND_GUIDES, type IslandGuide } from "../lib/islandCopy";
import type { IslandMode } from "../lib/liveActivity";
import { useAppTheme } from "../lib/theme";

type Props = {
  mode: IslandMode | null;
  visible: boolean;
  onClose: () => void;
};

/** Explication FR quand on tape l’île (deep link) ou « Comprendre ». */
export default function IslandGuideSheet({ mode, visible, onClose }: Props) {
  const theme = useAppTheme();
  const guide: IslandGuide | null = mode ? ISLAND_GUIDES[mode] : null;
  if (!guide) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <View style={[styles.handle, { backgroundColor: theme.cardBorder }]} />
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.accent, { backgroundColor: guide.accent }]} />
          <Text style={[styles.kicker, { color: guide.accent }]}>
            DYNAMIC ISLAND · GUIDE
          </Text>
          <Text style={[styles.title, { color: theme.text }]}>
            {guide.title}
          </Text>
          <Text style={[styles.tagline, { color: theme.textMuted }]}>
            {guide.tagline}
          </Text>

          <Text style={[styles.section, { color: theme.text }]}>
            Pourquoi tu vois ça
          </Text>
          <Text style={[styles.body, { color: theme.textSecondary }]}>
            {guide.why}
          </Text>

          <Text style={[styles.section, { color: theme.text }]}>
            Comment le lire
          </Text>
          {guide.how.map((line, i) => (
            <View key={line} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: guide.accent }]}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </View>
              <Text style={[styles.stepText, { color: theme.textSecondary }]}>
                {line}
              </Text>
            </View>
          ))}

          <View
            style={[
              styles.tipBox,
              {
                backgroundColor: theme.card,
                borderColor: theme.cardBorder,
              },
            ]}
          >
            <Text style={[styles.tipLabel, { color: guide.accent }]}>
              Astuce
            </Text>
            <Text style={[styles.body, { color: theme.textSecondary }]}>
              {guide.tip}
            </Text>
          </View>

          <Text style={[styles.limit, { color: theme.textMuted }]}>
            Limite Apple : l’île n’affiche que titre, sous-titre et barre de
            temps. La « beauté » se joue surtout dans le texte et les couleurs —
            un vrai design custom (icônes, layout) demande un rebuild du widget.
          </Text>

          <Pressable
            onPress={onClose}
            style={[styles.cta, { backgroundColor: guide.accent }]}
          >
            <Text style={styles.ctaText}>Compris — revenir</Text>
          </Pressable>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    marginTop: 10,
    marginBottom: 6,
  },
  content: { padding: 22, paddingBottom: 40, gap: 10 },
  accent: {
    width: 44,
    height: 6,
    borderRadius: 3,
    marginBottom: 8,
  },
  kicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  tagline: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 8,
  },
  section: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 14,
    marginBottom: 4,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
  },
  stepRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    marginTop: 8,
  },
  stepNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  stepNumText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  stepText: { flex: 1, fontSize: 15, lineHeight: 22 },
  tipBox: {
    marginTop: 16,
    borderRadius: 16,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  tipLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.5 },
  limit: { fontSize: 12, lineHeight: 17, marginTop: 12 },
  cta: {
    marginTop: 18,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
