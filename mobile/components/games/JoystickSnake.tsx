import { useRef, useState } from "react";
import { LayoutChangeEvent, StyleSheet, View } from "react-native";
import GameArena, { useGameLoop, useStickRef } from "./GameArena";

type Props = { onClose: () => void };

const COLS = 14;
const ROWS = 18;

/** Snake piloté au joystick (dernière direction dominante). */
export default function JoystickSnake({ onClose }: Props) {
  const { stick, onStick } = useStickRef();
  const [playing, setPlaying] = useState(true);
  const playingRef = useRef(true);
  const [score, setScore] = useState(0);
  const dir = useRef({ x: 1, y: 0 });
  const acc = useRef(0);
  const snakeRef = useRef([
    { x: 4, y: 9 },
    { x: 3, y: 9 },
    { x: 2, y: 9 },
  ]);
  const foodRef = useRef({ x: 10, y: 9 });
  const [, setFrame] = useState(0);
  const [size, setSize] = useState({ w: 1, h: 1 });
  const scoreRef = useRef(0);

  const bump = () => setFrame((n) => n + 1);

  const placeFood = (body: { x: number; y: number }[]) => {
    for (let i = 0; i < 80; i++) {
      const p = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
      if (!body.some((b) => b.x === p.x && b.y === p.y)) return p;
    }
    return { x: 0, y: 0 };
  };

  const reset = () => {
    playingRef.current = true;
    setPlaying(true);
    scoreRef.current = 0;
    setScore(0);
    dir.current = { x: 1, y: 0 };
    acc.current = 0;
    snakeRef.current = [
      { x: 4, y: 9 },
      { x: 3, y: 9 },
      { x: 2, y: 9 },
    ];
    foodRef.current = placeFood(snakeRef.current);
    bump();
  };

  useGameLoop(playing, (dt) => {
    const s = stick.current;
    if (Math.hypot(s.x, s.y) > 0.35) {
      if (Math.abs(s.x) > Math.abs(s.y)) {
        const nx = s.x > 0 ? 1 : -1;
        if (nx !== -dir.current.x) dir.current = { x: nx, y: 0 };
      } else {
        const ny = s.y > 0 ? 1 : -1;
        if (ny !== -dir.current.y) dir.current = { x: 0, y: ny };
      }
    }

    acc.current += dt;
    const stepEvery = Math.max(0.12, 0.28 - scoreRef.current * 0.004);
    if (acc.current < stepEvery) return;
    acc.current = 0;

    const body = snakeRef.current;
    const head = {
      x: body[0].x + dir.current.x,
      y: body[0].y + dir.current.y,
    };
    if (
      head.x < 0 ||
      head.y < 0 ||
      head.x >= COLS ||
      head.y >= ROWS ||
      body.some((b) => b.x === head.x && b.y === head.y)
    ) {
      playingRef.current = false;
      setPlaying(false);
      bump();
      return;
    }
    const next = [head, ...body];
    if (head.x === foodRef.current.x && head.y === foodRef.current.y) {
      scoreRef.current += 1;
      setScore(scoreRef.current);
      foodRef.current = placeFood(next);
      snakeRef.current = next;
    } else {
      next.pop();
      snakeRef.current = next;
    }
    bump();
  });

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const cellW = size.w / COLS;
  const cellH = size.h / ROWS;
  const snake = snakeRef.current;
  const food = foodRef.current;

  return (
    <GameArena
      title="Snake Stick"
      tint="#34d399"
      score={score}
      status={playing ? "Oriente le pad" : "Game over"}
      playing={playing}
      onClose={onClose}
      onRestart={reset}
      onStick={onStick}
    >
      <View style={styles.field} onLayout={onLayout}>
        <View
          style={[
            styles.food,
            {
              width: cellW * 0.72,
              height: cellH * 0.72,
              left: food.x * cellW + cellW * 0.14,
              top: food.y * cellH + cellH * 0.14,
              borderRadius: Math.min(cellW, cellH) * 0.36,
            },
          ]}
        />
        {snake.map((seg, i) => (
          <View
            key={`${seg.x}-${seg.y}-${i}`}
            style={[
              styles.seg,
              {
                width: cellW * 0.86,
                height: cellH * 0.86,
                left: seg.x * cellW + cellW * 0.07,
                top: seg.y * cellH + cellH * 0.07,
                borderRadius: 4,
                opacity: i === 0 ? 1 : 0.75,
                backgroundColor: i === 0 ? "#6ee7b7" : "#34d399",
              },
            ]}
          />
        ))}
      </View>
    </GameArena>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, backgroundColor: "#07140f" },
  food: { position: "absolute", backgroundColor: "#f472b6" },
  seg: { position: "absolute" },
});
