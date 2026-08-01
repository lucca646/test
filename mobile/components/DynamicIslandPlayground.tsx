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
  needsRestart,
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
    hint: "Now Playing — titre + barre de progression.",
  },
  {
    id: "progress",
    label: "Progress",
    hint: "Livraison / téléchargement avec % circulaire.",
  },
];

type Props = {
  mode: IslandMode;
  onChange: (mode: IslandMode) => void;
};

/**
 * Playground Dynamic Island — 3 modes contenu seulement.
 * Changer de mode pendant une activité → Update (ou restart si config différente).
 */
export default function DynamicIslandPlayground({ mode, onChange }: Props) {
  const theme = useAppTheme();
  const bridge = useMemo(() => getLiveActivityBridge(), []);
  const activityId = useRef<string | null>(null);
  const activeMode = useRef<IslandMode | null>(null);
  const tick = useRef(0);
  const applyingMode = useRef(false);

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
      if (activityId.current && bridge.stopActivity) {
        try {
          const { state } = stateForMode(activeMode.current ?? mode);
          bridge.stopActivity(activityId.current, state);
        } catch {
          /* ignore */
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Changement de mode pendant une activité → sync native. */
  useEffect(() => {
    if (!running || !activityId.current || applyingMode.current) return;
    if (activeMode.current === mode) return;

    const prev = activeMode.current;
    const id = activityId.current;

    const sync = () => {
      try {
        if (prev && needsRestart(prev, mode)) {
          // config (timer digital vs circulaire) non modifiable via update
          if (bridge.stopActivity && bridge.startActivity) {
            const old = stateForMode(prev);
            bridge.stopActivity(id, {
              ...old.state,
              title: "Changement…",
              subtitle: mode,
            });
            const next = stateForMode(mode, 0);
            tick.current = 0;
            const newId = bridge.startActivity(next.state, next.config);
            if (!newId) {
              activityId.current = null;
              activeMode.current = null;
              setRunning(false);
              setStatus("Échec restart — relance Start.");
              return;
            }
            activityId.current = String(newId);
            activeMode.current = mode;
            setPulseKey((k) => k + 1);
            setStatus(`Mode « ${mode} » (restart ActivityKit).`);
            return;
          }
        }

        if (!bridge.updateActivity) return;
        tick.current += 1;
        const { state } = stateForMode(mode, tick.current);
        bridge.updateActivity(id, {
          ...state,
          subtitle: `${state.subtitle ?? mode} · ${timeNow()}`,
        });
        activeMode.current = mode;
        setPulseKey((k) => k + 1);
        setStatus(`Mode « ${mode} » poussé sur l’île.`);
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
      }
    };

    sync();
  }, [mode, running, bridge]);

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

  const selectMode = (next: IslandMode) => {
    if (next === mode) return;
    onChange(next);
  };

  const onStart = () =>
    run(() => {
      if (!bridge.startActivity) {
        setStatus(bridge.reason ?? "startActivity indisponible");
        return;
      }
      // remplace une activité déjà active
      if (activityId.current && bridge.stopActivity) {
        try {
          const prev = stateForMode(activeMode.current ?? mode);
          bridge.stopActivity(activityId.current, prev.state);
        } catch {
          /* ignore */
        }
      }
      applyingMode.current = true;
      tick.current = 0;
      const { state, config } = stateForMode(mode, 0);
      const id = bridge.startActivity(state, config);
      applyingMode.current = false;
      if (!id) {
        setStatus(
          "Échec startActivity (iOS < 16.2, permissions, ou Expo Go).",
        );
        return;
      }
      activityId.current = String(id);
      activeMode.current = mode;
      setRunning(true);
      setPulseKey((k) => k + 1);
      setStatus(`Live Activity « ${mode} » — change de mode ci-dessus.`);
    });

  const onUpdate = () =>
    run(() => {
      if (!bridge.updateActivity || !activityId.current) {
        setStatus("Aucune activité — Start d’abord.");
        return;
      }
      tick.current += 1;
      const n = tick.current;
      const { state } = stateForMode(mode, n);
      bridge.updateActivity(activityId.current, {
        ...state,
        subtitle: `Update #${n} · ${timeNow()}`,
      });
      setPulseKey((k) => k + 1);
      setStatus(`Contenu #${n} poussé (${mode}).`);
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
      activeMode.current = null;
      setRunning(false);
      setStatus("Live Activity arrêtée.");
    });

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Dynamic Island
      </Text>
      <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
        3 modes natifs. Pendant Start, tape un autre mode pour basculer
        (Update, ou restart auto si Timer ↔ Progress). Long press sur l’île =
        expand système Apple.
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
              style={[
                styles.chip,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  borderColor: theme.cardBorder,
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
          onPress={onUpdate}
          disabled={busy || !running}
        />
        <ActionButton
          label="Stop"
          onPress={onStop}
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
              ? `Native · ${mode}`
              : "Native · prêt"
            : "Expo Go / non natif"}
        </Text>
        <Text style={styles.statusText}>{status}</Text>
      </View>
    </View>
  );
}

function timeNow() {
  return new Date().toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
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
  expCtrl: { color: "#fff", fontSize: 16, fontWeight: "700" },
  art: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#0a84ff",
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
