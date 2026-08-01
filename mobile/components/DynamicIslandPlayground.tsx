import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import {
  autopilotInterval,
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
  tag: string;
}[] = [
  {
    id: "timer",
    label: "Timer",
    tag: "classic",
    hint: "Compte à rebours digital sur l’île.",
  },
  {
    id: "music",
    label: "Music",
    tag: "classic",
    hint: "Now Playing — titres qui défilent.",
  },
  {
    id: "progress",
    label: "Livraison",
    tag: "classic",
    hint: "Parcours colis en 4 étapes.",
  },
  {
    id: "focus",
    label: "Focus",
    tag: "new",
    hint: "Pomodoro live : Focus ↔ Pause auto.",
  },
  {
    id: "breathe",
    label: "Breathe",
    tag: "new",
    hint: "Guide respiration 4 temps sur l’île.",
  },
  {
    id: "score",
    label: "Score",
    tag: "new",
    hint: "Ticker match COR vs ALT en direct.",
  },
];

type Props = {
  mode: IslandMode;
  onChange: (mode: IslandMode) => void;
};

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
  const [autopilot, setAutopilot] = useState(true);
  const [phaseLabel, setPhaseLabel] = useState<string>("—");
  const [status, setStatus] = useState<string>(
    bridge.available
      ? "Start un mode · Autopilot pousse l’île toute seule."
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

  const pushTick = (nextMode: IslandMode, n: number) => {
    if (!bridge.updateActivity || !activityId.current) return;
    const { state } = stateForMode(nextMode, n);
    bridge.updateActivity(activityId.current, state);
    setPhaseLabel(state.title);
    setPulseKey((k) => k + 1);
  };

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
      setPhaseLabel(state.title);
      setRunning(true);
      setPulseKey((k) => k + 1);
      setStatus(`Île = « ${nextMode} » · ${reason}`);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      return true;
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
      return false;
    } finally {
      if (gen === syncGen.current) setBusy(false);
    }
  };

  useEffect(() => {
    if (!running) return;
    if (activeMode.current === mode) return;
    void launch(mode, "changement de mode");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  /** Autopilot : pousse le prochain tick sur l’île. */
  useEffect(() => {
    if (!running || !autopilot || busy) return;
    const ms = autopilotInterval(mode);
    const handle = setInterval(() => {
      if (!activityId.current || activeMode.current !== mode) return;
      tick.current += 1;
      try {
        pushTick(mode, tick.current);
        setStatus(`Autopilot #${tick.current} · ${mode}`);
        if (mode === "breathe" || mode === "focus") {
          void Haptics.selectionAsync();
        }
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
      }
    }, ms);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, autopilot, mode, busy]);

  const selectMode = (next: IslandMode) => {
    if (next === mode || busy) return;
    onChange(next);
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
      setPhaseLabel("—");
      setStatus("Live Activity arrêtée.");
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setBusy(false);
    }
  };

  const classics = ISLAND_MODES.filter((m) => m.tag === "classic");
  const news = ISLAND_MODES.filter((m) => m.tag === "new");

  return (
    <View style={styles.wrap}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>
        Dynamic Island Live
      </Text>
      <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
        Autopilot = l’île se met à jour toute seule (Focus / Breathe / Score…).
        Change de mode pendant Start · long press = expand Apple.
      </Text>

      <View style={styles.previewStage}>
        <IslandPreview
          mode={mode}
          pulseKey={pulseKey}
          running={running}
          phaseLabel={phaseLabel}
        />
      </View>

      <View style={styles.autoRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.autoTitle, { color: theme.text }]}>
            Autopilot
          </Text>
          <Text style={[styles.autoHint, { color: theme.textMuted }]}>
            Pousse un nouveau state toutes les{" "}
            {(autopilotInterval(mode) / 1000).toFixed(1)}s
          </Text>
        </View>
        <Switch
          value={autopilot}
          onValueChange={setAutopilot}
          trackColor={{ false: "#3a3a3c", true: "rgba(10,132,255,0.55)" }}
          thumbColor={autopilot ? "#0a84ff" : "#f4f4f5"}
        />
      </View>

      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>
        Classiques
      </Text>
      <ModeChips
        modes={classics}
        mode={mode}
        busy={busy}
        theme={theme}
        onSelect={selectMode}
      />

      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>
        Innovants
      </Text>
      <ModeChips
        modes={news}
        mode={mode}
        busy={busy}
        theme={theme}
        onSelect={selectMode}
      />

      <Text style={[styles.modeHint, { color: theme.textMuted }]}>
        {ISLAND_MODES.find((m) => m.id === mode)?.hint}
        {running ? " · native" : ""}
        {autopilot && running ? " · autopilot" : ""}
        {busy ? " · sync…" : ""}
      </Text>

      <View style={styles.actions}>
        <ActionButton
          label={running ? "Relancer" : "Start"}
          onPress={() => void launch(mode, "Start")}
          disabled={busy}
          primary
        />
        <ActionButton
          label="Tick +"
          onPress={() => {
            if (!running) return;
            tick.current += 1;
            pushTick(mode, tick.current);
            setStatus(`Tick manuel #${tick.current}`);
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }}
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

function ModeChips({
  modes,
  mode,
  busy,
  theme,
  onSelect,
}: {
  modes: typeof ISLAND_MODES;
  mode: IslandMode;
  busy: boolean;
  theme: ReturnType<typeof useAppTheme>;
  onSelect: (m: IslandMode) => void;
}) {
  return (
    <View style={styles.chips}>
      {modes.map((m) => {
        const on = m.id === mode;
        return (
          <Pressable
            key={m.id}
            onPress={() => onSelect(m.id)}
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
              m.tag === "new" && !on && styles.chipNew,
            ]}
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
  if (mode === "timer" || mode === "breathe") {
    return { width: 126, height: 36, radius: 18, pad: 12 };
  }
  return { width: 300, height: 88, radius: 24, pad: 14 };
}

function IslandPreview({
  mode,
  pulseKey,
  running,
  phaseLabel,
}: {
  mode: IslandMode;
  pulseKey: number;
  running: boolean;
  phaseLabel: string;
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
      <PreviewInner mode={mode} phaseLabel={phaseLabel} />
    </Animated.View>
  );
}

function PreviewInner({
  mode,
  phaseLabel,
}: {
  mode: IslandMode;
  phaseLabel: string;
}) {
  if (mode === "timer") {
    return (
      <View style={styles.innerRow}>
        <Text style={styles.compactLead}>TIM</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.compactTrail}>04:59</Text>
      </View>
    );
  }
  if (mode === "breathe") {
    return (
      <View style={styles.innerRow}>
        <Text style={styles.compactLead}>AIR</Text>
        <View style={{ flex: 1 }} />
        <Text style={styles.compactTrail}>
          {phaseLabel === "—" ? "Inspire" : phaseLabel}
        </Text>
      </View>
    );
  }
  if (mode === "score") {
    return (
      <View style={styles.innerCol}>
        <Text style={styles.expTitle}>
          {phaseLabel.startsWith("COR") ? phaseLabel : "COR 12 — 10 ALT"}
        </Text>
        <Text style={styles.expSub}>Q1 · live ticker</Text>
      </View>
    );
  }
  if (mode === "focus") {
    return (
      <View style={styles.innerCol}>
        <Text style={styles.expTitle}>
          {phaseLabel.includes("Pause") ? "Pause · recharge" : "Focus · deep work"}
        </Text>
        <Text style={styles.expSub}>Pomodoro live sur l’île</Text>
      </View>
    );
  }
  if (mode === "music") {
    return (
      <View style={styles.innerCol}>
        <Text style={styles.expTitle}>Liquid Glass</Text>
        <Text style={styles.expSub}>COR·ALT · Live</Text>
      </View>
    );
  }
  return (
    <View style={styles.innerCol}>
      <Text style={styles.expTitle}>Livraison</Text>
      <Text style={styles.expSub}>4 étapes · ETA live</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "600" },
  sectionHint: { fontSize: 13, lineHeight: 18 },
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
  previewRunning: { borderColor: "rgba(48,209,88,0.55)" },
  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  autoTitle: { fontSize: 15, fontWeight: "700" },
  autoHint: { fontSize: 12, marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    minWidth: 76,
    alignItems: "center",
  },
  chipOn: {
    backgroundColor: "rgba(10,132,255,0.28)",
    borderColor: "rgba(10,132,255,0.7)",
  },
  chipNew: { borderColor: "rgba(48,209,88,0.45)" },
  chipText: { fontSize: 13, fontWeight: "600" },
  chipTextOn: { color: "#fff" },
  modeHint: { fontSize: 12, lineHeight: 17 },
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
  innerRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  innerCol: { flex: 1, gap: 6, justifyContent: "center" },
  compactLead: { color: "#fff", fontSize: 12, fontWeight: "700" },
  compactTrail: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    fontVariant: ["tabular-nums"],
    fontWeight: "600",
  },
  expTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  expSub: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
});
