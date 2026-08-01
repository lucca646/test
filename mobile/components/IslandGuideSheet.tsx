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
      presentationStyle="pageSheet"
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
