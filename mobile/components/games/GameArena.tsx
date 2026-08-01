import { useCallback, useEffect, useRef, type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import DualControls from "./DualControls";
import type { StickVector } from "./VirtualJoystick";

type Props = {
  title: string;
  tint: string;
  score: number;
  status?: string;
  playing: boolean;
  onClose: () => void;
  onRestart: () => void;
  onStick: (v: StickVector) => void;
  children: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
};

/** Cadre plein écran : terrain + HUD + contrôles multi-touch. */
export default function GameArena({
  title,
  tint,
  score,
  status,
  playing,
  onClose,
  onRestart,
  onStick,
  children,
  actionLabel,
  onAction,
}: Props) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const fieldH = Math.min(420, Math.max(280, height * 0.48));

  return (
    <View style={[styles.root, { paddingTop: insets.top + 8 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={12} style={styles.chip}>
          <Text style={styles.chipText}>← Jeux</Text>
        </Pressable>
        <Text style={styles.title}>{title}</Text>
        <Pressable onPress={onRestart} hitSlop={12} style={styles.chip}>
          <Text style={styles.chipText}>Reset</Text>
        </Pressable>
      </View>

      <View style={styles.hud}>
        <Text style={[styles.score, { color: tint }]}>Score {score}</Text>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </View>

      <View style={[styles.field, { height: fieldH, borderColor: `${tint}55` }]}>
        {children}
        {!playing ? (
          <View style={styles.overlay}>
            <Text style={styles.overlayTitle}>Partie terminée</Text>
            <Pressable
              onPress={onRestart}
              style={[styles.overlayBtn, { backgroundColor: tint }]}
            >
              <Text style={styles.overlayBtnText}>Rejouer</Text>
            </Pressable>
          </View>
        ) : null}
      </View>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
        <DualControls
          tint={tint}
          onStick={onStick}
          actionLabel={actionLabel}
          onAction={onAction}
        />
      </View>
    </View>
  );
}

/** Boucle ~60fps. */
export function useGameLoop(running: boolean, tick: (dt: number) => void) {
  const tickRef = useRef(tick);
  tickRef.current = tick;

  useEffect(() => {
    if (!running) return;
    let last = Date.now();
    const id = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      tickRef.current(dt);
    }, 16);
    return () => clearInterval(id);
  }, [running]);
}

export function useStickRef() {
  const stick = useRef<StickVector>({ x: 0, y: 0 });
  const onStick = useCallback((v: StickVector) => {
    stick.current = v;
  }, []);
  return { stick, onStick };
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#050508",
    paddingHorizontal: 14,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  chipText: { color: "#fff", fontWeight: "600", fontSize: 13 },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  hud: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  score: { fontSize: 22, fontWeight: "800", letterSpacing: -0.3 },
  status: { color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: "600" },
  field: {
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "#0b0b12",
    overflow: "hidden",
    position: "relative",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
  },
  overlayTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  overlayBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
  },
  overlayBtnText: { color: "#fff", fontWeight: "800", fontSize: 15 },
});
