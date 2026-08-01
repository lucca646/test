import { useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import GameArena, { useGameLoop, useStickRef } from "./GameArena";

type Orb = { id: number; x: number; y: number; good: boolean; vx: number; vy: number };

type Props = { onClose: () => void };

/** Collecte les orbes bleues, évite les rouges — stick analogique. */
export default function OrbRush({ onClose }: Props) {
  const { stick, onStick } = useStickRef();
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const livesRef = useRef(3);
  const playerRef = useRef({ x: 0.5, y: 0.5 });
  const orbsRef = useRef<Orb[]>([]);
  const [, setFrame] = useState(0);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const spawnAcc = useRef(0);
  const idRef = useRef(1);

  const bump = () => setFrame((n) => n + 1);

  const reset = () => {
    playingRef.current = true;
    setPlaying(true);
    setScore(0);
    livesRef.current = 3;
    setLives(3);
    playerRef.current = { x: 0.5, y: 0.5 };
    orbsRef.current = [];
    spawnAcc.current = 0;
    bump();
  };

  useGameLoop(playing, (dt) => {
    const speed = 0.7;
    const p = playerRef.current;
    p.x = Math.max(0.05, Math.min(0.95, p.x + stick.current.x * speed * dt));
    p.y = Math.max(0.05, Math.min(0.95, p.y + stick.current.y * speed * dt));

    spawnAcc.current += dt;
    if (spawnAcc.current > 0.7) {
      spawnAcc.current = 0;
      const good = Math.random() > 0.32;
      const ang = Math.random() * Math.PI * 2;
      const sp = 0.08 + Math.random() * 0.12;
      orbsRef.current.push({
        id: idRef.current++,
        x: Math.random(),
        y: Math.random(),
        good,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
      });
      if (orbsRef.current.length > 18) {
        orbsRef.current = orbsRef.current.slice(-18);
      }
    }

    const next: Orb[] = [];
    for (const o of orbsRef.current) {
      let x = o.x + o.vx * dt;
      let y = o.y + o.vy * dt;
      let { vx, vy } = o;
      if (x < 0.04 || x > 0.96) vx *= -1;
      if (y < 0.04 || y > 0.96) vy *= -1;
      x = Math.max(0.04, Math.min(0.96, x));
      y = Math.max(0.04, Math.min(0.96, y));
      if (Math.hypot(x - p.x, y - p.y) < 0.055) {
        if (o.good) setScore((n) => n + 5);
        else {
          livesRef.current -= 1;
          setLives(livesRef.current);
          if (livesRef.current <= 0) {
            playingRef.current = false;
            setPlaying(false);
          }
        }
        continue;
      }
      next.push({ ...o, x, y, vx, vy });
    }
    orbsRef.current = next;
    bump();
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const player = playerRef.current;
  const orbs = orbsRef.current;

  return (
    <GameArena
      title="Orb Rush"
      tint="#60a5fa"
      score={score}
      status={playing ? `Vies ${lives}` : "Plus de vies"}
      playing={playing}
      onClose={onClose}
      onRestart={reset}
      onStick={onStick}
    >
      <View style={styles.field} onLayout={onLayout}>
        {orbs.map((o) => (
          <View
            key={o.id}
            style={[
              styles.orb,
              {
                left: o.x * size.w - 10,
                top: o.y * size.h - 10,
                backgroundColor: o.good ? "#38bdf8" : "#f87171",
              },
            ]}
          />
        ))}
        <View
          style={[
            styles.player,
            {
              left: player.x * size.w - 16,
              top: player.y * size.h - 16,
            },
          ]}
        />
      </View>
    </GameArena>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, backgroundColor: "#070b16" },
  player: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#60a5fa",
    borderWidth: 3,
    borderColor: "#fff",
  },
  orb: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
});
