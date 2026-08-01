import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import TabScreen from "../components/TabScreen";
import AsteroidPilot from "../components/games/AsteroidPilot";
import JoystickSnake from "../components/games/JoystickSnake";
import OrbRush from "../components/games/OrbRush";
import { useAppTheme } from "../lib/theme";

type GameId = "pilot" | "snake" | "orb";

const GAMES: {
  id: GameId;
  title: string;
  blurb: string;
  tint: string;
}[] = [
  {
    id: "pilot",
    title: "Asteroid Pilot",
    blurb: "Stick à droite + FEU à gauche (multi-touch). Esquive et tire.",
    tint: "#fb923c",
  },
  {
    id: "snake",
    title: "Snake Stick",
    blurb: "Oriente le serpent avec le pad. Mange les orbes roses.",
    tint: "#34d399",
  },
  {
    id: "orb",
    title: "Orb Rush",
    blurb: "Attrape le bleu, évite le rouge. 3 vies, stick analogique.",
    tint: "#60a5fa",
  },
];

export default function GamesTab() {
  const [active, setActive] = useState<GameId | null>(null);
  const theme = useAppTheme();

  if (active === "pilot") return <AsteroidPilot onClose={() => setActive(null)} />;
  if (active === "snake") return <JoystickSnake onClose={() => setActive(null)} />;
  if (active === "orb") return <OrbRush onClose={() => setActive(null)} />;

  return (
    <TabScreen
      title="Jeux"
      body="3 mini-jeux jouables avec joystick virtuel — touche une carte pour lancer."
      tint={["#fb923c", "#ea580c"]}
    >
      <View style={styles.list}>
        {GAMES.map((g) => (
          <Pressable
            key={g.id}
            onPress={() => setActive(g.id)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: theme.card,
                borderColor: `${g.tint}66`,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={[styles.dot, { backgroundColor: g.tint }]} />
            <View style={styles.copy}>
              <Text style={[styles.cardTitle, { color: theme.text }]}>
                {g.title}
              </Text>
              <Text style={[styles.cardBody, { color: theme.textMuted }]}>
                {g.blurb}
              </Text>
            </View>
            <Text style={[styles.play, { color: g.tint }]}>Jouer →</Text>
          </Pressable>
        ))}
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  dot: { width: 14, height: 14, borderRadius: 7 },
  copy: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 17, fontWeight: "700" },
  cardBody: {
    fontSize: 13,
    lineHeight: 18,
  },
  play: { fontWeight: "800", fontSize: 13 },
});
