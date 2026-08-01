import { useCallback, useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import GameArena, { useGameLoop, useStickRef } from "./GameArena";

type Rock = { id: number; x: number; y: number; r: number; vy: number };
type Bullet = { id: number; x: number; y: number };

type Props = { onClose: () => void };

/** Vaisseau + joystick : esquive les astéroïdes, tire avec le bouton. */
export default function AsteroidPilot({ onClose }: Props) {
  const { stick, onStick } = useStickRef();
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);
  const [score, setScore] = useState(0);
  const shipRef = useRef({ x: 0.5, y: 0.82 });
  const [, setFrame] = useState(0);
  const rocksRef = useRef<Rock[]>([]);
  const bulletsRef = useRef<Bullet[]>([]);
  const sizeRef = useRef({ w: 1, h: 1 });
  const [size, setSize] = useState({ w: 1, h: 1 });
  const idRef = useRef(1);
  const spawnAcc = useRef(0);

  const bump = () => setFrame((n) => n + 1);

  const reset = () => {
    playingRef.current = true;
    setPlaying(true);
    setScore(0);
    shipRef.current = { x: 0.5, y: 0.82 };
    rocksRef.current = [];
    bulletsRef.current = [];
    spawnAcc.current = 0;
    bump();
  };

  const fire = useCallback(() => {
    if (!playingRef.current) return;
    const s = shipRef.current;
    bulletsRef.current = [
      ...bulletsRef.current,
      { id: idRef.current++, x: s.x, y: s.y - 0.04 },
    ];
    bump();
  }, []);

  useGameLoop(playing, (dt) => {
    const speed = 0.55;
    const s = shipRef.current;
    s.x = Math.max(0.06, Math.min(0.94, s.x + stick.current.x * speed * dt));
    s.y = Math.max(0.08, Math.min(0.92, s.y + stick.current.y * speed * dt));

    spawnAcc.current += dt;
    if (spawnAcc.current > 0.55) {
      spawnAcc.current = 0;
      rocksRef.current.push({
        id: idRef.current++,
        x: 0.08 + Math.random() * 0.84,
        y: -0.08,
        r: 0.035 + Math.random() * 0.03,
        vy: 0.22 + Math.random() * 0.28,
      });
    }

    bulletsRef.current = bulletsRef.current
      .map((b) => ({ ...b, y: b.y - 1.1 * dt }))
      .filter((b) => b.y > -0.05);

    const nextRocks: Rock[] = [];
    for (const r of rocksRef.current) {
      const y = r.y + r.vy * dt;
      let hitBullet = false;
      bulletsRef.current = bulletsRef.current.filter((b) => {
        if (Math.hypot(r.x - b.x, y - b.y) < r.r + 0.02) {
          hitBullet = true;
          setScore((n) => n + 10);
          return false;
        }
        return true;
      });
      if (hitBullet) continue;
      if (y > 1.1) {
        setScore((n) => n + 1);
        continue;
      }
      if (Math.hypot(r.x - s.x, y - s.y) < r.r + 0.035) {
        playingRef.current = false;
        setPlaying(false);
      }
      nextRocks.push({ ...r, y });
    }
    rocksRef.current = nextRocks;
    bump();
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    sizeRef.current = { w: width, h: height };
    setSize({ w: width, h: height });
  };

  const ship = shipRef.current;
  const rocks = rocksRef.current;
  const bullets = bulletsRef.current;

  return (
    <GameArena
      title="Asteroid Pilot"
      tint="#fb923c"
      score={score}
      status={playing ? "Esquive + tire" : "Crash !"}
      playing={playing}
      onClose={onClose}
      onRestart={reset}
      onStick={onStick}
      actionLabel="FEU"
      onAction={fire}
    >
      <View style={styles.field} onLayout={onLayout}>
        {rocks.map((r) => (
          <View
            key={r.id}
            style={[
              styles.rock,
              {
                width: r.r * 2 * size.w,
                height: r.r * 2 * size.w,
                borderRadius: r.r * size.w,
                left: r.x * size.w - r.r * size.w,
                top: r.y * size.h - r.r * size.w,
              },
            ]}
          />
        ))}
        {bullets.map((b) => (
          <View
            key={b.id}
            style={[
              styles.bullet,
              { left: b.x * size.w - 3, top: b.y * size.h - 8 },
            ]}
          />
        ))}
        <View
          style={[
            styles.ship,
            { left: ship.x * size.w - 14, top: ship.y * size.h - 14 },
          ]}
        />
      </View>
    </GameArena>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1 },
  ship: {
    position: "absolute",
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#fb923c",
    borderWidth: 2,
    borderColor: "#fff",
    transform: [{ rotate: "45deg" }],
  },
  rock: {
    position: "absolute",
    backgroundColor: "#78716c",
    borderWidth: 1,
    borderColor: "#a8a29e",
  },
  bullet: {
    position: "absolute",
    width: 6,
    height: 16,
    borderRadius: 3,
    backgroundColor: "#fde68a",
  },
});
