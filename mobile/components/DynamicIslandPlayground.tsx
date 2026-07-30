import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import Slider from "@react-native-community/slider";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
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

type AnimPreset = "spring" | "ease" | "snappy";

const PRESET_META: Record<
  AnimPreset,
  { label: string; hint: string }
> = {
  spring: { label: "Spring", hint: "Ressort iOS-like (aperçu in-app)." },
  ease: { label: "Ease", hint: "Courbe douce timing (aperçu in-app)." },
  snappy: { label: "Snappy", hint: "Morph rapide, peu d’overshoot." },
};

/**
 * Playground Dynamic Island :
 * - aperçu UI animé (durée / ressort modifiables ici)
 * - Start / Update / Stop → vraie Live Activity (Dev Client)
 *
 * Limite Apple : les morphs Compact↔Expanded↔Minimal sur l’île réelle
 * sont 100 % système. On ne peut pas injecter durée/easing custom.
 * On anime l’aperçu in-app + on pousse le contenu natif (Update).
 */
export default function DynamicIslandPlayground({ mode, onChange }: Props) {
  const bridge = useMemo(() => getLiveActivityBridge(), []);
  const activityId = useRef<string | null>(null);
  const updateTick = useRef(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState<string>(
    bridge.available
      ? "Prêt — lance une Live Activity sur l’île système."
      : bridge.reason ?? "Indisponible",
  );
  const [busy, setBusy] = useState(false);
  const [durationMs, setDurationMs] = useState(420);
  const [damping, setDamping] = useState(16);
  const [preset, setPreset] = useState<AnimPreset>("spring");
  const [previewTick, setPreviewTick] = useState(0);

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

  /** Si une activité tourne, changer de mode contenu pousse le nouveau state. */
  useEffect(() => {
    if (!running || !activityId.current || !bridge.updateActivity) return;
    if (["compact", "minimal", "expanded"].includes(mode)) {
      setStatus(
        `Aperçu « ${mode} » — morph réel = long press sur l’île (iOS).`,
      );
      return;
    }
    try {
      const { state } = stateForMode(mode);
      bridge.updateActivity(activityId.current, {
        ...state,
        subtitle: `${String(state.subtitle ?? mode)} · ${new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`,
      });
      setStatus(`Île mise à jour → « ${mode} » (transition contenu Apple).`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
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

  const onStart = () =>
    run(() => {
      if (!bridge.startActivity) {
        setStatus(bridge.reason ?? "startActivity indisponible");
        return;
      }
      const contentMode: IslandMode = ["compact", "minimal", "expanded"].includes(
        mode,
      )
        ? "timer"
        : mode;
      if (contentMode !== mode) onChange(contentMode);
      const { state, config } = stateForMode(contentMode);
      const id = bridge.startActivity(state, config);
      if (!id) {
        setStatus(
          "Échec startActivity (iOS < 16.2, permissions, ou Expo Go).",
        );
        return;
      }
      activityId.current = String(id);
      updateTick.current = 0;
      setRunning(true);
      setStatus(
        `Live Activity démarrée · ${contentMode}. Change Timer/Music/Progress ou Update.`,
      );
    });

  const onUpdate = () =>
    run(() => {
      if (!bridge.updateActivity || !activityId.current) {
        setStatus("Aucune activité active — Start d’abord.");
        return;
      }
      updateTick.current += 1;
      const n = updateTick.current;
      const { state } = stateForMode(mode);
      const progressBase =
        state.progressBar &&
        typeof state.progressBar === "object" &&
        "progress" in state.progressBar
          ? ((state.progressBar as { progress?: number }).progress ?? 0.35)
          : 0.35;
      const nextProgress = Math.min(0.95, progressBase + n * 0.14);

      const titles =
        mode === "music"
          ? ["Liquid Glass", "COR·ALT Live", "Island Drop", "Morph Test"]
          : mode === "progress"
            ? ["Livraison en cours", "Colis en route", "Presque là", "Dernier km"]
            : ["Timer Liquid Glass", "Focus 25′", "Pause courte", "Sprint final"];

      const next = {
        ...state,
        title: titles[n % titles.length],
        subtitle: `Update #${n} · ${new Date().toLocaleTimeString("fr-FR")}`,
        progressBar:
          state.progressBar &&
          typeof state.progressBar === "object" &&
          "date" in state.progressBar
            ? { date: Date.now() + Math.max(60_000, (5 - (n % 5)) * 60_000) }
            : { progress: nextProgress },
      };
      bridge.updateActivity(activityId.current, next);
      setStatus(
        `Contenu #${n} poussé — iOS anime le texte/barre (pas le morph).`,
      );
      setPreviewTick((t) => t + 1);
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
      setRunning(false);
      setStatus("Live Activity arrêtée.");
    });

  const layoutModes = ISLAND_MODES.filter((m) =>
    ["compact", "minimal", "expanded"].includes(m.id),
  );
  const contentModes = ISLAND_MODES.filter((m) =>
    ["timer", "music", "progress"].includes(m.id),
  );

  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionTitle}>Dynamic Island</Text>
      <Text style={styles.sectionHint}>
        Les morphs Compact ↔ Expanded sur l’île réelle sont gérés par Apple
        (long press) — durée / easing non modifiables. Ci-dessous : anime
        l’aperçu in-app, puis Start / Update pour le contenu natif.
      </Text>

      <View style={styles.previewStage}>
        <IslandPreview
          mode={mode}
          durationMs={durationMs}
          damping={damping}
          preset={preset}
          pulseKey={previewTick}
        />
      </View>

      <Text style={styles.groupLabel}>Animations aperçu (in-app)</Text>
      <View style={styles.chips}>
        {(Object.keys(PRESET_META) as AnimPreset[]).map((id) => {
          const on = id === preset;
          return (
            <Pressable
              key={id}
              onPress={() => setPreset(id)}
              style={[styles.chip, on && styles.chipOn]}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>
                {PRESET_META[id].label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={styles.sliderLabel}>
        Durée · {Math.round(durationMs)} ms
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={120}
        maximumValue={1200}
        step={20}
        value={durationMs}
        onValueChange={setDurationMs}
        minimumTrackTintColor="#0a84ff"
        maximumTrackTintColor="rgba(255,255,255,0.2)"
        thumbTintColor="#fff"
      />
      <Text style={styles.sliderLabel}>
        Ressort · damping {damping.toFixed(0)}
      </Text>
      <Slider
        style={styles.slider}
        minimumValue={6}
        maximumValue={36}
        step={1}
        value={damping}
        onValueChange={setDamping}
        minimumTrackTintColor="#0a84ff"
        maximumTrackTintColor="rgba(255,255,255,0.2)"
        thumbTintColor="#fff"
        disabled={preset === "ease"}
      />
      <Text style={styles.modeHint}>{PRESET_META[preset].hint}</Text>

      <Text style={styles.groupLabel}>Forme aperçu (pas forcé sur l’île)</Text>
      <View style={styles.chips}>
        {layoutModes.map((m) => {
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

      <Text style={styles.groupLabel}>Contenu Live Activity (poussé natif)</Text>
      <View style={styles.chips}>
        {contentModes.map((m) => {
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
        {running ? " · activité native en cours" : ""}
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

function layoutForMode(mode: IslandMode) {
  switch (mode) {
    case "minimal":
      return { width: 36, height: 36, radius: 18, pad: 0 };
    case "compact":
    case "timer":
      return { width: 126, height: 36, radius: 18, pad: 12 };
    case "music":
    case "progress":
    case "expanded":
    default:
      return { width: 300, height: 88, radius: 24, pad: 14 };
  }
}

function IslandPreview({
  mode,
  durationMs,
  damping,
  preset,
  pulseKey,
}: {
  mode: IslandMode;
  durationMs: number;
  damping: number;
  preset: AnimPreset;
  pulseKey: number;
}) {
  const target = layoutForMode(mode);
  const width = useSharedValue(target.width);
  const height = useSharedValue(target.height);
  const radius = useSharedValue(target.radius);
  const pad = useSharedValue(target.pad);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const next = layoutForMode(mode);
    if (preset === "spring") {
      const cfg = {
        damping,
        stiffness: 180,
        mass: 0.85,
        overshootClamping: false,
      };
      width.value = withSpring(next.width, cfg);
      height.value = withSpring(next.height, cfg);
      radius.value = withSpring(next.radius, cfg);
      pad.value = withSpring(next.pad, cfg);
    } else if (preset === "snappy") {
      const cfg = {
        damping: Math.max(damping, 22),
        stiffness: 420,
        mass: 0.55,
        overshootClamping: true,
      };
      width.value = withSpring(next.width, cfg);
      height.value = withSpring(next.height, cfg);
      radius.value = withSpring(next.radius, cfg);
      pad.value = withSpring(next.pad, cfg);
    } else {
      const cfg = {
        duration: durationMs,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      };
      width.value = withTiming(next.width, cfg);
      height.value = withTiming(next.height, cfg);
      radius.value = withTiming(next.radius, cfg);
      pad.value = withTiming(next.pad, cfg);
    }
  }, [mode, durationMs, damping, preset, width, height, radius, pad]);

  useEffect(() => {
    if (pulseKey === 0) return;
    pulse.value = withTiming(1.06, { duration: 90 }, () => {
      pulse.value = withSpring(1, { damping: 12, stiffness: 220 });
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
    <Animated.View style={[styles.previewShell, boxStyle]}>
      <BlurView intensity={48} tint="dark" style={StyleSheet.absoluteFill} />
      <PreviewInner mode={mode} />
    </Animated.View>
  );
}

function PreviewInner({ mode }: { mode: IslandMode }) {
  if (mode === "minimal") {
    return (
      <View style={styles.innerCenter}>
        <View style={styles.miniDot} />
      </View>
    );
  }

  if (mode === "compact" || mode === "timer") {
    return (
      <View style={styles.innerRow}>
        <Text style={styles.compactLead}>
          {mode === "timer" ? "TIM" : "LG"}
        </Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.compactTrail}>
          {mode === "timer" ? "04:59" : "2:14"}
        </Text>
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

  if (mode === "progress") {
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

  return (
    <View style={styles.innerCol}>
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
  sliderLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontWeight: "600",
  },
  slider: { width: "100%", height: 32 },
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
  innerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  innerRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  innerCol: { flex: 1, gap: 8, justifyContent: "center" },
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
