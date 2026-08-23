import { useEffect, useSyncExternalStore } from "react";
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { setupCarPlay } from "./lib/carplay";
import { getState, pause, playStation, subscribe } from "./src/player";
import { STATIONS } from "./src/stations";

export default function App() {
  const { stationId, playing, error } = useSyncExternalStore(
    subscribe,
    getState,
  );

  useEffect(() => {
    // No-op hors iOS natif lié : Expo Go et Android passent au travers.
    setupCarPlay();
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Text style={styles.title}>Radios</Text>
        <Text style={styles.subtitle}>
          {playing ? "En lecture" : "Choisis une station"}
        </Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.list}>
        {STATIONS.map((station) => {
          const active = station.id === stationId;
          const isPlaying = active && playing;
          return (
            <Pressable
              key={station.id}
              style={({ pressed }) => [
                styles.row,
                active && styles.rowActive,
                pressed && styles.rowPressed,
              ]}
              onPress={() =>
                isPlaying ? pause() : void playStation(station.id)
              }
            >
              <View style={styles.rowText}>
                <Text style={styles.name}>{station.name}</Text>
                <Text style={styles.tagline}>{station.tagline}</Text>
              </View>
              <Text style={styles.glyph}>{isPlaying ? "❚❚" : "▶"}</Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.hint}>
        Branche la voiture, ou dans le simulateur : I/O → External Displays →
        CarPlay.
      </Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0b0f" },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { color: "#fff", fontSize: 34, fontWeight: "700" },
  subtitle: { color: "#8e8e93", fontSize: 15, marginTop: 4 },
  error: {
    color: "#ff453a",
    fontSize: 14,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  list: { paddingHorizontal: 16, gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17171c",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  rowActive: { backgroundColor: "#1c2733" },
  rowPressed: { opacity: 0.6 },
  rowText: { flex: 1 },
  name: { color: "#fff", fontSize: 17, fontWeight: "600" },
  tagline: { color: "#8e8e93", fontSize: 13, marginTop: 2 },
  glyph: { color: "#0a84ff", fontSize: 18, fontWeight: "700" },
  hint: {
    color: "#5a5a60",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 32,
    marginTop: "auto",
    marginBottom: 16,
  },
});
