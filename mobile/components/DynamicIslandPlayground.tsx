import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";

export type IslandMode =
  | "compact"
  | "minimal"
  | "expanded"
  | "timer"
  | "music"
  | "progress";

export const ISLAND_MODES: {
  id: IslandMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "compact",
    label: "Compact",
    hint: "Leading + trailing dans l’île (état par défaut).",
  },
  {
    id: "minimal",
    label: "Minimal",
    hint: "Petit pastille quand une autre activité partage l’île.",
  },
  {
    id: "expanded",
    label: "Expanded",
    hint: "Long press / expand — régions leading / trailing / center / bottom.",
  },
  {
    id: "timer",
    label: "Timer",
    hint: "Compte à rebours style Live Activity (Lock Screen + île).",
  },
  {
    id: "music",
    label: "Now Playing",
    hint: "Lecture : artwork compact + contrôles en expanded.",
  },
  {
    id: "progress",
    label: "Progress",
    hint: "Livraison / téléchargement avec barre de progression.",
  },
];

type Props = {
  mode: IslandMode;
  onChange: (mode: IslandMode) => void;
};

/**
 * Aperçu visuel des présentations Dynamic Island.
 * En Expo Go = simulation UI. Live Activity réelle = EAS / prebuild + ActivityKit.
 */
export default function DynamicIslandPlayground({ mode, onChange }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Dynamic Island</Text>
      <Text style={styles.sectionHint}>
        Choisis une présentation. Aperçu ci-dessous — la vraie île système
        demande une Live Activity (build native, pas Expo Go).
      </Text>

      <View style={styles.previewStage}>
        <IslandPreview mode={mode} />
      </View>

      <View style={styles.chips}>
        {ISLAND_MODES.map((m) => {
          const on = m.id === mode;
          return (
            <Pressable
              key={m.id}
              onPress={() => onChange(m.id)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.modeHint}>
        {ISLAND_MODES.find((m) => m.id === mode)?.hint}
      </Text>
    </View>
  );
}

function IslandPreview({ mode }: { mode: IslandMode }) {
  if (mode === "minimal") {
    return (
      <View style={styles.minimal}>
        <View style={styles.miniDot} />
      </View>
    );
  }

  if (mode === "compact") {
    return (
      <View style={styles.compact}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.compactLead}>LG</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.compactTrail}>2:14</Text>
      </View>
    );
  }

  if (mode === "timer") {
    return (
      <View style={styles.compact}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.compactLead}>TIM</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.compactTrail}>04:59</Text>
      </View>
    );
  }

  if (mode === "music") {
    return (
      <View style={styles.expanded}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.expRow}>
          <View style={styles.art} />
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.expTitle}>Liquid Glass</Text>
            <Text style={styles.expSub}>COR·ALT · Live</Text>
          </View>
          <Text style={styles.expCtrl}>II</Text>
        </View>
      </View>
    );
  }

  if (mode === "progress") {
    return (
      <View style={styles.expanded}>
        <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
        <Text style={styles.expTitle}>Livraison</Text>
        <Text style={styles.expSub}>Arrivée estimée · 12 min</Text>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: "62%" }]} />
        </View>
      </View>
    );
  }

  // expanded
  return (
    <View style={styles.expanded}>
      <BlurView intensity={50} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.expRow}>
        <View style={styles.liveDot} />
        <View style={{ flex: 1 }}>
          <Text style={styles.expTitle}>Session active</Text>
          <Text style={styles.expSub}>Expanded · 4 régions</Text>
        </View>
        <Text style={styles.expTrail}>iOS</Text>
      </View>
      <View style={styles.expBottom}>
        <Text style={styles.expSub}>leading · trailing · center · bottom</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sectionTitle: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  sectionHint: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    lineHeight: 18,
  },
  previewStage: {
    minHeight: 88,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
  },
  chipOn: {
    backgroundColor: "rgba(10,132,255,0.28)",
    borderColor: "rgba(10,132,255,0.7)",
  },
  chipText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 13,
    fontWeight: "600",
  },
  chipTextOn: { color: "#fff" },
  modeHint: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    lineHeight: 17,
  },
  minimal: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
  },
  miniDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ff9f0a",
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#30d158",
  },
  compact: {
    width: 126,
    height: 36,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "#000",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  compactLead: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
  },
  compactTrail: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  expanded: {
    width: "92%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    backgroundColor: "#000",
    padding: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expLead: { color: "#30d158", fontSize: 14 },
  expTrail: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  expTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  expSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  expCtrl: { color: "#fff", fontSize: 16 },
  expBottom: {
    paddingTop: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.12)",
  },
  art: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#7c3aed",
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.15)",
    overflow: "hidden",
    marginTop: 4,
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#0a84ff",
    borderRadius: 3,
  },
});
