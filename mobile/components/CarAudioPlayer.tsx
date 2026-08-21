import { useEffect, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import {
  CAR_TRACKS,
  configureCarAudio,
  lockScreenMetadata,
} from "../lib/carAudio";
import { useAppTheme } from "../lib/theme";

/**
 * Lecteur audio qui alimente l'écran Now Playing de CarPlay / écran verrouillé
 * (via `setActiveForLockScreen`). Aucun entitlement CarPlay requis.
 */
export default function CarAudioPlayer() {
  const theme = useAppTheme();
  const [index, setIndex] = useState(0);
  const player = useAudioPlayer({ uri: CAR_TRACKS[0].uri });
  const status = useAudioPlayerStatus(player);

  useEffect(() => {
    void configureCarAudio();
  }, []);

  const track = CAR_TRACKS[index];

  const playIndex = (next: number) => {
    const i = (next + CAR_TRACKS.length) % CAR_TRACKS.length;
    const t = CAR_TRACKS[i];
    setIndex(i);
    player.replace({ uri: t.uri });
    player.setActiveForLockScreen(true, lockScreenMetadata(t));
    player.play();
  };

  const toggle = () => {
    if (status.playing) {
      player.pause();
      return;
    }
    player.setActiveForLockScreen(true, lockScreenMetadata(track));
    player.play();
  };

  return (
    <View style={styles.wrap}>
      <View
        style={[
          styles.player,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        <Image source={{ uri: track.artworkUrl }} style={styles.art} />
        <Text style={[styles.title, { color: theme.text }]} numberOfLines={1}>
          {track.title}
        </Text>
        <Text
          style={[styles.artist, { color: theme.textMuted }]}
          numberOfLines={1}
        >
          {track.artist} · {track.albumTitle}
        </Text>

        <View style={styles.controls}>
          <Pressable
            onPress={() => playIndex(index - 1)}
            hitSlop={12}
            accessibilityLabel="Piste précédente"
          >
            <Ionicons name="play-skip-back" size={30} color={theme.text} />
          </Pressable>

          <Pressable
            onPress={toggle}
            hitSlop={12}
            style={styles.playBtn}
            accessibilityLabel={status.playing ? "Pause" : "Lecture"}
          >
            <Ionicons
              name={status.playing ? "pause-circle" : "play-circle"}
              size={72}
              color="#0a84ff"
            />
          </Pressable>

          <Pressable
            onPress={() => playIndex(index + 1)}
            hitSlop={12}
            accessibilityLabel="Piste suivante"
          >
            <Ionicons name="play-skip-forward" size={30} color={theme.text} />
          </Pressable>
        </View>

        <Text style={[styles.hint, { color: theme.textMuted }]}>
          {status.isBuffering
            ? "Chargement…"
            : status.playing
              ? "En lecture — visible sur le Now Playing CarPlay de la voiture"
              : "Lance la lecture puis branche CarPlay"}
        </Text>
      </View>

      <View
        style={[
          styles.list,
          { backgroundColor: theme.card, borderColor: theme.cardBorder },
        ]}
      >
        {CAR_TRACKS.map((t, i) => {
          const active = i === index;
          return (
            <Pressable
              key={t.id}
              onPress={() => playIndex(i)}
              style={styles.row}
            >
              <Ionicons
                name={active && status.playing ? "volume-high" : "musical-note"}
                size={18}
                color={active ? "#0a84ff" : theme.textMuted}
              />
              <View style={styles.rowText}>
                <Text
                  style={[
                    styles.rowTitle,
                    { color: active ? "#0a84ff" : theme.text },
                  ]}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
                <Text
                  style={[styles.rowArtist, { color: theme.textMuted }]}
                  numberOfLines={1}
                >
                  {t.artist}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 16 },
  player: {
    borderRadius: 24,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  art: {
    width: 200,
    height: 200,
    borderRadius: 18,
    marginBottom: 16,
    backgroundColor: "rgba(127,127,127,0.2)",
  },
  title: { fontSize: 20, fontWeight: "700", letterSpacing: -0.3 },
  artist: { fontSize: 14, marginTop: 4 },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 28,
    marginTop: 18,
  },
  playBtn: { marginHorizontal: 4 },
  hint: { fontSize: 12, marginTop: 14, textAlign: "center", maxWidth: 260 },
  list: {
    borderRadius: 20,
    padding: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  rowText: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: "600" },
  rowArtist: { fontSize: 13, marginTop: 2 },
});
