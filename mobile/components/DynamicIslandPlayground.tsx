import { useEffect, useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { beatsForMode, ISLAND_GUIDES } from "../lib/islandCopy";
import {
  autopilotInterval,
  getLiveActivityBridge,
  killActivities,
  stateForMode,
  type IslandMode,
} from "../lib/liveActivity";
import { useAppTheme } from "../lib/theme";
import IslandGuideSheet from "./IslandGuideSheet";

export type { IslandMode };

export const ISLAND_MODES: {
  id: IslandMode;
  label: string;
  tag: "classic" | "new";
}[] = [
  { id: "breathe", label: "Respirer", tag: "new" },
  { id: "focus", label: "Focus", tag: "new" },
  { id: "score", label: "Score", tag: "new" },
  { id: "timer", label: "Minuteur", tag: "classic" },
  { id: "music", label: "Musique", tag: "classic" },
  { id: "progress", label: "Livraison", tag: "classic" },
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
  const [autopilot, setAutopilot] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideMode, setGuideMode] = useState<IslandMode | null>(mode);
  const [phaseTitle, setPhaseTitle] = useState(
    () => beatsForMode(mode, 0).title,
  );
  const [phaseSub, setPhaseSub] = useState(() => beatsForMode(mode, 0).subtitle);
  const [phaseMeta, setPhaseMeta] = useState(
    () => beatsForMode(mode, 0).meta ?? {},
  );
  const [status, setStatus] = useState(
    bridge.available
      ? "Choisis un mode, Start, puis regarde l’île — ou tape Comprendre."
      : (bridge.reason ?? "Indisponible"),
  );
  const [pulseKey, setPulseKey] = useState(0);

  const guide = ISLAND_GUIDES[mode];

  useEffect(() => {
    const b = beatsForMode(mode, tick.current);
    setPhaseTitle(b.title);
    setPhaseSub(b.subtitle);
    setPhaseMeta(b.meta ?? {});
  }, [mode]);

  useEffect(() => {
    return () => {
      void killActivities(bridge, knownIds.current);
      knownIds.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const applyBeat = (nextMode: IslandMode, n: number) => {
    const b = beatsForMode(nextMode, n);
    setPhaseTitle(b.title);
    setPhaseSub(b.subtitle);
    setPhaseMeta(b.meta ?? {});
    setPulseKey((k) => k + 1);
    return b;
  };

  const pushTick = (nextMode: IslandMode, n: number) => {
    if (!bridge.updateActivity || !activityId.current) return;
    const { state } = stateForMode(nextMode, n);
    bridge.updateActivity(activityId.current, state);
    applyBeat(nextMode, n);
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
        setStatus("Impossible de démarrer l’activité — réessaie.");
        return false;
      }
      knownIds.current.add(String(id));
      activityId.current = String(id);
      activeMode.current = nextMode;
      applyBeat(nextMode, 0);
      setRunning(true);
      setStatus(
        `Sur l’île : « ${state.title} ». Tape Comprendre pour l’explication.`,
      );
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch {
        /* ignore */
      }
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
    void launch(mode, "mode");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (!running || !autopilot || busy) return;
    const ms = autopilotInterval(mode);
    const handle = setInterval(() => {
      if (!activityId.current || activeMode.current !== mode) return;
      tick.current += 1;
      try {
        pushTick(mode, tick.current);
        setStatus(`Phase suivante envoyée sur l’île · ${mode}`);
        if (mode === "breathe" || mode === "focus") {
          try {
            void Haptics.selectionAsync();
          } catch {
            /* ignore */
          }
        }
      } catch (e) {
        setStatus(e instanceof Error ? e.message : String(e));
      }
    }, ms);
    return () => clearInterval(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, autopilot, mode, busy]);

  const openGuide = () => {
    setGuideMode(mode);
    setGuideOpen(true);
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
      setStatus("Activité retirée de l’île.");
      try {
        void Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } catch {
        /* ignore */
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      {guideOpen ? (
        <IslandGuideSheet
          mode={guideMode}
          visible={guideOpen}
          onClose={() => setGuideOpen(false)}
        />
      ) : null}

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            {guide.title}
          </Text>
          <Text style={[styles.sectionHint, { color: theme.textMuted }]}>
            {guide.tagline}
          </Text>
        </View>
        <Pressable
          onPress={openGuide}
          style={[styles.helpBtn, { borderColor: guide.accent }]}
        >
          <Text style={[styles.helpBtnText, { color: guide.accent }]}>
            Comprendre
          </Text>
        </Pressable>
      </View>

      <View style={styles.previewStage}>
        <IslandPreview
          mode={mode}
          pulseKey={pulseKey}
          running={running}
          title={phaseTitle}
          subtitle={phaseSub}
          accent={guide.accent}
          meta={phaseMeta}
        />
      </View>

      <View
        style={[
          styles.readout,
          {
            backgroundColor: theme.isDark
              ? "rgba(255,255,255,0.06)"
              : "rgba(0,0,0,0.04)",
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <Text style={[styles.readoutLabel, { color: guide.accent }]}>
          Sur l’île en ce moment
        </Text>
        <Text style={[styles.readoutTitle, { color: theme.text }]}>
          {mode === "score" && phaseTitle.includes("|")
            ? phaseTitle.replace("|", "  —  ")
            : phaseTitle}
        </Text>
        <Text style={[styles.readoutSub, { color: theme.textMuted }]}>
          {phaseSub}
        </Text>
        <Text style={[styles.readoutWhy, { color: theme.textSecondary }]}>
          {mode === "score"
            ? running
              ? "Aperçu = 2 blocs. Sur l’île réelle : après le build « côtés », tu auras 12 à gauche et 16 à droite du pill."
              : "L’aperçu ci-dessus ≠ le widget Apple. Les chiffres sur les côtés demandent 1 build natif (déjà préparé)."
            : running
              ? "Chaque mode a sa forme : Score = chiffres, Livraison = étapes + ETA, Musique = ♪ + timer — pas de barre partout."
              : "Start envoie cette expérience sur l’île. Change de mode pour voir la diversité."}
        </Text>
      </View>

      <View style={styles.autoRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.autoTitle, { color: theme.text }]}>
            Autopilot
          </Text>
          <Text style={[styles.autoHint, { color: theme.textMuted }]}>
            Enchaîne les phases toutes les{" "}
            {(autopilotInterval(mode) / 1000).toFixed(0)} s
          </Text>
        </View>
        <Switch
          value={autopilot}
          onValueChange={setAutopilot}
          trackColor={{ false: "#3a3a3c", true: `${guide.accent}88` }}
          thumbColor={autopilot ? guide.accent : "#f4f4f5"}
        />
      </View>

      <Text style={[styles.groupLabel, { color: theme.textMuted }]}>
        Choisir une expérience
      </Text>
      <View style={styles.chips}>
        {ISLAND_MODES.map((m) => {
          const on = m.id === mode;
          const accent = ISLAND_GUIDES[m.id].accent;
          return (
            <Pressable
              key={m.id}
              onPress={() => !busy && onChange(m.id)}
              disabled={busy}
              style={[
                styles.chip,
                {
                  backgroundColor: theme.isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.05)",
                  borderColor: on ? accent : theme.cardBorder,
                  opacity: busy ? 0.55 : 1,
                },
                on && { backgroundColor: `${accent}33` },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  { color: on ? accent : theme.textSecondary },
                ]}
              >
                {m.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.actions}>
        <ActionButton
          label={running ? "Relancer" : "Start"}
          onPress={() => void launch(mode, "Start")}
          disabled={busy}
          color={guide.accent}
        />
        <ActionButton
          label="Phase +"
          onPress={() => {
            if (!running) return;
            tick.current += 1;
            pushTick(mode, tick.current);
            try {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            } catch {
              /* ignore */
            }
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

      <Text style={[styles.statusText, { color: theme.textMuted }]}>
        {status}
      </Text>
    </View>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  color,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  color?: string;
  danger?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.actionBtn,
        color ? { backgroundColor: color } : null,
        danger && styles.actionDanger,
        !color && !danger && styles.actionMuted,
        disabled && { opacity: 0.45 },
      ]}
    >
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

function layoutForPreview(mode: IslandMode) {
  switch (mode) {
    case "score":
      return { width: 320, height: 108, radius: 28, pad: 14 };
    case "breathe":
      return { width: 200, height: 72, radius: 36, pad: 14 };
    case "timer":
      return { width: 168, height: 40, radius: 20, pad: 12 };
    case "progress":
      return { width: 312, height: 92, radius: 24, pad: 14 };
    case "music":
      return { width: 300, height: 88, radius: 22, pad: 14 };
    case "focus":
    default:
      return { width: 300, height: 88, radius: 24, pad: 14 };
  }
}

function IslandPreview({
  mode,
  pulseKey,
  running,
  title,
  subtitle,
  accent,
  meta,
}: {
  mode: IslandMode;
  pulseKey: number;
  running: boolean;
  title: string;
  subtitle: string;
  accent: string;
  meta: Record<string, string | number>;
}) {
  const target = layoutForPreview(mode);
  const width = useSharedValue(target.width);
  const height = useSharedValue(target.height);
  const radius = useSharedValue(target.radius);
  const pad = useSharedValue(target.pad);
  const pulse = useSharedValue(1);

  useEffect(() => {
    const next = layoutForPreview(mode);
    const cfg = { damping: 16, stiffness: 200, mass: 0.8 };
    width.value = withSpring(next.width, cfg);
    height.value = withSpring(next.height, cfg);
    radius.value = withSpring(next.radius, cfg);
    pad.value = withSpring(next.pad, cfg);
  }, [mode, width, height, radius, pad]);

  useEffect(() => {
    if (pulseKey === 0) return;
    pulse.value = withSpring(1.04, { damping: 10, stiffness: 280 }, () => {
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
        running && { borderColor: `${accent}99` },
      ]}
    >
      <BlurView intensity={52} tint="dark" style={StyleSheet.absoluteFill} />
      <PreviewByMode
        mode={mode}
        title={title}
        subtitle={subtitle}
        accent={accent}
        meta={meta}
      />
    </Animated.View>
  );
}

function PreviewByMode({
  mode,
  title,
  subtitle,
  accent,
  meta,
}: {
  mode: IslandMode;
  title: string;
  subtitle: string;
  accent: string;
  meta: Record<string, string | number>;
}) {
  if (mode === "score") {
    const home = Number(meta.home ?? 12);
    const away = Number(meta.away ?? 10);
    return (
      <View style={styles.scoreRow}>
        <View style={[styles.scoreBlock, { borderColor: accent }]}>
          <Text style={styles.scoreTeam}>COR</Text>
          <Text style={[styles.scoreNum, { color: accent }]}>{home}</Text>
        </View>
        <Text style={styles.scoreVs}>vs</Text>
        <View style={[styles.scoreBlock, { borderColor: "#fff" }]}>
          <Text style={styles.scoreTeam}>ALT</Text>
          <Text style={styles.scoreNum}>{away}</Text>
        </View>
      </View>
    );
  }

  if (mode === "breathe") {
    return (
      <View style={styles.breatheWrap}>
        <View style={[styles.breatheRing, { borderColor: accent }]} />
        <Text style={[styles.breatheWord, { color: accent }]} numberOfLines={1}>
          {title.replace(/^[^\wÀ-ÿ]+/, "")}
        </Text>
      </View>
    );
  }

  if (mode === "timer") {
    return (
      <View style={styles.innerRow}>
        <Text style={styles.compactLead}>MIN</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.compactTrail, { color: accent }]}>
          {title.includes("25") ? "25:00" : title.includes("3 ") ? "03:00" : "05:00"}
        </Text>
      </View>
    );
  }

  if (mode === "progress") {
    const step = Number(meta.step ?? 1);
    return (
      <View style={styles.innerCol}>
        <Text style={styles.expTitle} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.expSub} numberOfLines={1}>
          {subtitle}
        </Text>
        <View style={styles.stepsRow}>
          {[1, 2, 3, 4].map((n) => (
            <View
              key={n}
              style={[
                styles.stepDot,
                {
                  backgroundColor: n <= step ? accent : "rgba(255,255,255,0.2)",
                },
              ]}
            />
          ))}
        </View>
      </View>
    );
  }

  if (mode === "music") {
    return (
      <View style={styles.musicRow}>
        <View style={styles.eq}>
          {[0.4, 0.8, 0.55, 0.95, 0.35].map((h, i) => (
            <View
              key={i}
              style={[
                styles.eqBar,
                { height: 10 + h * 28, backgroundColor: accent },
              ]}
            />
          ))}
        </View>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={styles.expTitle} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.expSub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </View>
    );
  }

  // focus
  return (
    <View style={styles.innerCol}>
      <Text style={[styles.expTitle, { color: accent }]} numberOfLines={1}>
        {title}
      </Text>
      <Text style={styles.expSub} numberOfLines={2}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  headerRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.3 },
  sectionHint: { fontSize: 13, lineHeight: 18, marginTop: 4 },
  helpBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  helpBtnText: { fontSize: 13, fontWeight: "700" },
  previewStage: {
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  previewShell: {
    overflow: "hidden",
    backgroundColor: "#000",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.14)",
    maxWidth: "100%",
  },
  readout: {
    borderRadius: 16,
    padding: 14,
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
  },
  readoutLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginBottom: 2,
  },
  readoutTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  readoutSub: { fontSize: 13, lineHeight: 18 },
  readoutWhy: { fontSize: 13, lineHeight: 18, marginTop: 8 },
  autoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  autoTitle: { fontSize: 15, fontWeight: "700" },
  autoHint: { fontSize: 12, marginTop: 2 },
  groupLabel: {
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipText: { fontSize: 13, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 8 },
  actionBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  actionMuted: { backgroundColor: "rgba(255,255,255,0.12)" },
  actionDanger: { backgroundColor: "rgba(255,69,58,0.9)" },
  actionText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  statusText: { fontSize: 12, lineHeight: 17 },
  innerRow: { flex: 1, flexDirection: "row", alignItems: "center" },
  innerCol: { flex: 1, gap: 5, justifyContent: "center" },
  compactLead: { color: "#fff", fontSize: 13, fontWeight: "700", flexShrink: 1 },
  compactTrail: { fontSize: 12, fontWeight: "700" },
  expTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  expSub: { color: "rgba(255,255,255,0.65)", fontSize: 12, lineHeight: 16 },
  scoreRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  scoreBlock: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingVertical: 8,
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  scoreTeam: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
  scoreNum: {
    color: "#fff",
    fontSize: 32,
    fontWeight: "800",
    fontVariant: ["tabular-nums"],
    letterSpacing: -1,
  },
  scoreVs: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 12,
    fontWeight: "700",
  },
  breatheWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  breatheRing: {
    position: "absolute",
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    opacity: 0.45,
  },
  breatheWord: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  stepsRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  stepDot: { width: 22, height: 6, borderRadius: 3 },
  musicRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  eq: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 3,
    height: 40,
  },
  eqBar: { width: 5, borderRadius: 2 },
});
