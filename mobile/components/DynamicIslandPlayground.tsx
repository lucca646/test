import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  getLiveActivityBridge,
  killActivities,
  stateForMode,
  type IslandMode,
} from "../lib/liveActivity";
import { useAppTheme } from "../lib/theme";

export type { IslandMode };

export const ISLAND_MODES: {
  id: IslandMode;
  label: string;
  hint: string;
}[] = [
  {
    id: "timer",
    label: "Timer",
    hint: "Compte à rebours digital sur l’île + Lock Screen.",
  },
  {
    id: "music",
    label: "Music",
    hint: "Now Playing — titre + timer compact.",
  },
  {
    id: "progress",
    label: "Progress",
    hint: "Livraison — titre + timer circulaire compact.",
  },
];

type Props = {
  mode: IslandMode;
  onChange: (mode: IslandMode) => void;
};

/**
 * Playground Dynamic Island.
 * Chaque Start / changement de mode = kill all + restart (stopActivity est async).
 */
export default function DynamicIslandPlayground({ mode, onChange }: Props) {
  const theme = useAppTheme();
  const bridge = useMemo(() => getLiveActivityBridge(), []);
  const knownIds = useRef<Set<string>>(new Set());
  const activityId = useRef<string | null>(null);
  const activeMode = useRef<IslandMode | null>(null);
  const tick = useRef(0);
  const syncGen = useRef(0);

  const [running, setRunning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string>(
    bridge.available
      ? "Choisis un mode → Start. Ensuite change de mode librement."
      : (bridge.reason ?? "Indisponible"),
  );
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    return () => {
      void killActivities(bridge, knownIds.current);
      knownIds.current.clear();
      activityId.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const launch = async (nextMode: IslandMode, reason: string) => {
    if (!bridge.startActivity) {
      setStatus(bridge.reason ?? "startActivity indisponible");
      return false;
    }
    const gen = ++syncGen.current;
    setBusy(true);
    try {
      await killActivities(bridge, [
        ...knownIds.current,
        ...(activityId.current ? [activityId.current] : []),
      ]);
      knownIds.current.clear();
      activityId.current = null;

      if (gen !== syncGen.current) return false;

      tick.current = 0;
      const { state, config } = stateForMode(nextMode, 0);
      const id = bridge.startActivity(state, config);
      if (!id) {
        activeMode.current = null;
        setRunning(false);
        setStatus("Échec startActivity — réessaie Start.");
        return false;
      }
      const sid = String(id);
      knownIds.current.add(sid);
      activityId.current = sid;
      activeMode.current = nextMode;
      setRunning(true);
      setPulseKey((k) => k + 1);
      setStatus(`Île = « ${nextMode} » · ${reason}`);
      return true;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      if (gen === syncGen.current) setBusy(false);
    }
  };

  /** Changement de mode pendant une activité → restart propre. */
  useEffect(() => {
    if (!running) return;
    if (activeMode.current === mode) return;
    void launch(mode, "changement de mode");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const selectMode = (next: IslandMode) => {
    if (next === mode || busy) return;
    onChange(next);
  };

  const onStart = () => {
    void launch(mode, "Start");
  };

  const onUpdate = async () => {
    if (!bridge.updateActivity || !activityId.current) {
      setStatus("Aucune activité — Start d’abord.");
      return;
    }
    // Même mode : update contenu. Sinon restart via effect.
    if (activeMode.current !== mode) {
      void launch(mode, "sync mode");
      return;
    }
    setBusy(true);
    try {
      tick.current += 1;
      const n = tick.current;
      const { state } = stateForMode(mode, n);
      bridge.updateActivity(activityId.current, state);
      setPulseKey((k) => k + 1);
      setStatus(`Contenu #${n} · ${mode}`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onStop = async () => {
    setBusy(true);
    syncGen.current += 1;
    try {
      await killActivities(bridge, [
        ...knownIds.current,
        ...(activityId.current ? [activityId.current] : []),
      ]);
      knownIds.current.clear();
      activityId.current = null;
      activeMode.current = null;
      setRunning(false);
      setStatus("Live Activity arrêtée.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Dynamic Island
      </Text>
      <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
        Start puis change de mode : l’île redémarre proprement (plus de
        « Livraison » zombie). Long press = expand Apple.
      </Text>

      <View style={styles.previewStage}>
        <IslandPreview mode={mode} pulseKey={pulseKey} running={running} />
      </View>

      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>Mode</Text>
      <View style={styles.chips}>
        {ISLAND_MODES.map((m) => {
          const on = m.id === mode;
          return (
            <Pressable
              key={m.id}
              onPress={() => selectMode(m.id)}
              disabled={busy}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  borderColor: theme.cardBorder,
                  opacity: busy ? 0.55 : 1,
                },
                on && styles.chipOn,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: theme.textSecondary },
                  on && styles.chipTextOn,
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.modeHint, { color: theme.textMuted }]}>
        {ISLAND_MODES.find((m) => m.id === mode)?.hint}
        {running ? " · native en cours" : ""}
        {busy ? " · sync…" : ""}
      </Text>

      <View style={styles.actions}>
        <ActionButton
          label={running ? "Relancer" : "Start"}
          onPress={onStart}
          disabled={busy}
          primary
        />
        <ActionButton
          label="Update"
          onPress={() => void onUpdate()}
          disabled={busy || !running}
        />
        <ActionButton
          label="Stop"
          onPress={() => void onStop()}
          disabled={busy || !running}
          danger
        />
      </View>

      <View
        style={[
          styles.statusBox,
          bridge.available ? styles.statusOk : styles.statusWarn,
        ]}
      >
        <Text style={styles.statusLabel}>
          {bridge.available
            ? running
              ? `Native · ${activeMode.current ?? mode}`
              : "Native · prêt"
            : "Expo Go / non natif"}
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

function layoutForMode(mode: IslandMode) {
  switch (mode) {
    case "timer":
      return { width: 126, height: 36, radius: 18, pad: 12 };
    case "music":
    case "progress":
    default:
      return { width: 300, height: 88, radius: 24, pad: 14 };
  }
}

function IslandPreview({
  mode,
  pulseKey,
  running,
}: {
  mode: IslandMode;
  pulseKey: number;
  running: boolean;
}) {
  const target = layoutForMode(mode);
  const width = useSharedValue(target.width);
  const height = useSharedValue(target.height);
  const radius = useSharedValue(target.radius);
  const pad = useSharedValue(target.pad);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const next = layoutForMode(mode);
    const cfg = { damping: 16, stiffness: 200, mass: 0.8 };
    width.value = withSpring(next.width, cfg);
    height.value = withSpring(next.height, cfg);
    radius.value = withSpring(next.radius, cfg);
    pad.value = withSpring(next.pad, cfg);
  }, [mode, width, height, radius, pad]);

  useEffect(() => {
    if (pulseKey === 0) return;
    pulse.value = withSpring(1.05, { damping: 10, stiffness: 280 }, () => {
      pulse.value = withSpring(1, { damping: 14, stiffness: 220 });
    });
  }, [pulseKey, pulse]);

  const boxStyle = useAnimatedStyle(() => ({
    width: width.value,
    height: height.value,
    borderRadius: radius.value,
    padding: pad.value,
    transform: [{ scale: pulse.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.previewShell,
        boxStyle,
        running && styles.previewRunning,
      ]}
    >
      <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
      <PreviewInner mode={mode} />
    </Animated.View>
  );
}

function PreviewInner({ mode }: { mode: IslandMode }) {
  if (mode === "timer") {
    return (
      <View style={styles.innerRow}>
        <Text style={styles.compactLead}>TIM</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.compactTrail}>04:59</Text>
      </View>
    );
  }

  if (mode === "music") {
    return (
      <View style={styles.innerCol}>
        <View style={styles.expRow}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={styles.expTitle}>Liquid Glass</Text>
            <Text style={styles.expSub}>COR·ALT · Live</Text>
          </View>
          <Text style={styles.expCtrl}>3:12</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.innerCol}>
      <Text style={styles.expTitle}>Livraison</Text>
      <Text style={styles.expSub}>Arrivée estimée · 12 min</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: "62%" }]} />
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
    minHeight: 110,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  previewShell: {
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    maxWidth: "100%",
  },
  previewRunning: {
    borderColor: "rgba(48,209,88,0.55)",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  groupLabel: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    minWidth: 88,
    alignItems: "center",
  },
  chipOn: {
    backgroundColor: "rgba(10,132,255,0.28)",
    borderColor: "rgba(10,132,255,0.7)",
  },
  chipText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
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
  innerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  innerCol: { flex: 1, gap: 8, justifyContent: "center" },
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
  expRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  expTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  expSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  expCtrl: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
    fontVariant: ["tabular-nums"],
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
