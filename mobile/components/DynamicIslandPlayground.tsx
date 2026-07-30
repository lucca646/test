import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import {
  getLiveActivityBridge,
  stateForMode,
  type IslandMode,
} from "../lib/liveActivity";

export type { IslandMode };
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
    hint: "Compte à rebours Live Activity (Lock Screen + Dynamic Island).",
  },
  {
    id: "music",
    label: "Now Playing",
    hint: "Lecture : titre + progression (template ActivityKit).",
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
 * Playground Dynamic Island :
 * - aperçu UI toujours
 * - boutons Start / Update / Stop → vraie Live Activity (Dev Client)
 */
export default function DynamicIslandPlayground({ mode, onChange }: Props) {
  const bridge = useMemo(() => getLiveActivityBridge(), []);
  const activityId = useRef<string | null>(null);
  const [status, setStatus] = useState<string>(
    bridge.available
      ? "Prêt — lance une Live Activity sur l’île système."
      : bridge.reason ?? "Indisponible",
  );
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    return () => {
      if (activityId.current && bridge.stopActivity) {
        try {
          const { state } = stateForMode(mode);
          bridge.stopActivity(activityId.current, state);
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const run = (fn: () => void) => {
    setBusy(true);
    try {
      fn();
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onStart = () =>
    run(() => {
      if (!bridge.startActivity) {
        setStatus(bridge.reason ?? "startActivity indisponible");
        return;
      }
      const { state, config } = stateForMode(mode);
      const id = bridge.startActivity(state, config);
      if (!id) {
        setStatus(
          "Échec startActivity (iOS < 16.2, permissions, ou Expo Go).",
        );
        return;
      }
      activityId.current = id;
      setStatus(`Live Activity démarrée · id ${id.slice(0, 8)}…`);
    });

  const onUpdate = () =>
    run(() => {
      if (!bridge.updateActivity || !activityId.current) {
        setStatus("Aucune activité active — Start d’abord.");
        return;
      }
      const { state } = stateForMode(mode);
      // petite variation pour voir l’update
      const next = {
        ...state,
        subtitle: `${state.subtitle ?? ""} · maj ${new Date().toLocaleTimeString("fr-FR")}`,
        progressBar:
          "progress" in (state.progressBar ?? {})
            ? {
                progress: Math.min(
                  0.95,
                  ((state.progressBar as { progress?: number }).progress ??
                    0.4) + 0.1,
                ),
              }
            : state.progressBar,
      };
      bridge.updateActivity(activityId.current, next);
      setStatus(`Activity mise à jour (${mode}).`);
    });

  const onStop = () =>
    run(() => {
      if (!bridge.stopActivity || !activityId.current) {
        setStatus("Rien à arrêter.");
        return;
      }
      const { state } = stateForMode(mode);
      bridge.stopActivity(activityId.current, {
        ...state,
        title: "Terminé",
        subtitle: "Live Activity arrêtée",
      });
      activityId.current = null;
      setStatus("Live Activity arrêtée.");
    });

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Dynamic Island</Text>
      <Text style={styles.sectionHint}>
        Modes → aperçu. Puis Start pour pousser une vraie Live Activity sur
        l’île (Dev Client / build native uniquement).
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

      <View style={styles.actions}>
        <ActionButton
          label="Start"
          onPress={onStart}
          disabled={busy}
          primary
        />
        <ActionButton label="Update" onPress={onUpdate} disabled={busy} />
        <ActionButton label="Stop" onPress={onStop} disabled={busy} danger />
      </View>

      <View
        style={[
          styles.statusBox,
          bridge.available ? styles.statusOk : styles.statusWarn,
        ]}
      >
        <Text style={styles.statusLabel}>
          {bridge.available ? "Native · prêt" : "Expo Go / non natif"}
        </Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  primary,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  primary?: boolean;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionBtn,
        primary && styles.actionPrimary,
        danger && styles.actionDanger,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
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
  actions: { flexDirection: "row", gap: 8, marginTop: 4 },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  actionPrimary: { backgroundColor: "#0a84ff" },
  actionDanger: { backgroundColor: "rgba(255,69,58,0.85)" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  statusBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  statusOk: {
    backgroundColor: "rgba(48,209,88,0.12)",
    borderColor: "rgba(48,209,88,0.35)",
  },
  statusWarn: {
    backgroundColor: "rgba(255,159,10,0.12)",
    borderColor: "rgba(255,159,10,0.35)",
  },
  statusLabel: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  statusText: {
    color: "rgba(255,255,255,0.75)",
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
  expTrail: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontWeight: "600" },
  expTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  expSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  expCtrl: { color: "#fff", fontSize: 16, fontWeight: "700" },
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
