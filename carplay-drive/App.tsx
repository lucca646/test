import { useEffect, useSyncExternalStore } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { setupCarPlay } from "./lib/carplay";
import { GRID, LIST } from "./lib/carplay/icons";
import {
  SCENES,
  activeCount,
  device,
  devicesIn,
  formatTime,
  getState,
  refresh,
  runScene,
  startAmbient,
  subscribe,
  toggleDevice,
  type Zone,
} from "./src/home";

const ZONES: { key: Zone; title: string }[] = [
  { key: "home", title: "Maison" },
  { key: "vehicle", title: "Véhicule" },
];

export default function App() {
  const state = useSyncExternalStore(subscribe, getState);

  useEffect(() => {
    // No-op hors iOS natif lié : Android et le web passent au travers.
    setupCarPlay();
    // `setupCarPlay` démarre déjà le tick quand CarPlay est là ; l'appel est
    // idempotent et couvre le cas où il ne l'est pas.
    startAmbient();
  }, []);

  const alarm = device("alarm");
  const last = state.log[0];

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <Text style={styles.title}>Coraia Drive</Text>
          <Text style={styles.subtitle}>
            {activeCount()} appareil{activeCount() > 1 ? "s" : ""} actif
            {activeCount() > 1 ? "s" : ""} · synchro {formatTime(state.syncedAt)}
          </Text>
        </View>

        <Text style={styles.section}>Scènes</Text>
        <View style={styles.grid}>
          {SCENES.map((scene) => {
            const busy = state.running === scene.id;
            return (
              <Pressable
                key={scene.id}
                disabled={state.running !== null}
                onPress={() => void runScene(scene.id)}
                style={({ pressed }) => [
                  styles.tile,
                  scene.confirm && styles.tileWarn,
                  pressed && styles.pressed,
                  state.running !== null && !busy && styles.dimmed,
                ]}
              >
                {busy ? (
                  <ActivityIndicator color="#fff" style={styles.tileIcon} />
                ) : (
                  <Image
                    source={GRID[scene.icon]}
                    style={styles.tileIcon}
                    resizeMode="contain"
                  />
                )}
                <Text style={styles.tileLabel} numberOfLines={1}>
                  {scene.titleVariants[scene.titleVariants.length - 1]}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {ZONES.map(({ key, title }) => (
          <View key={key}>
            <Text style={styles.section}>{title}</Text>
            <View style={styles.card}>
              {devicesIn(key).map((d, i) => (
                <View
                  key={d.id}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                >
                  <Image
                    source={LIST[d.kind]}
                    style={[styles.rowIcon, !d.on && styles.rowIconOff]}
                    resizeMode="contain"
                  />
                  <View style={styles.rowText}>
                    <Text style={styles.rowName}>{d.name}</Text>
                    <Text style={styles.rowDetail}>
                      {d.reading ?? d.place}
                    </Text>
                  </View>
                  <Switch
                    value={d.on}
                    onValueChange={() => toggleDevice(d.id)}
                    trackColor={{ true: "#0a84ff", false: "#2c2c31" }}
                    thumbColor="#fff"
                  />
                </View>
              ))}
            </View>
          </View>
        ))}

        <Text style={styles.section}>État</Text>
        <View style={styles.card}>
          <Info label="Alarme" value={alarm?.on ? "Armée" : "Désarmée"} />
          <Info label="Extérieur" value={`${state.outsideTemp} °C`} border />
          <Info label="Habitacle" value={`${state.cabinTemp} °C`} border />
          <Info
            label="Dernière action"
            value={last ? last.text : "Aucune"}
            border
          />
        </View>

        <Pressable
          onPress={refresh}
          style={({ pressed }) => [styles.refresh, pressed && styles.pressed]}
        >
          <Text style={styles.refreshLabel}>Actualiser</Text>
        </Pressable>

        {state.log.length > 0 ? (
          <>
            <Text style={styles.section}>Journal</Text>
            <View style={styles.card}>
              {state.log.slice(0, 6).map((entry, i) => (
                <View
                  key={`${entry.at}-${i}`}
                  style={[styles.row, i > 0 && styles.rowBorder]}
                >
                  <Text style={styles.logTime}>{formatTime(entry.at)}</Text>
                  <Text style={styles.logText} numberOfLines={1}>
                    {entry.text}
                  </Text>
                </View>
              ))}
            </View>
          </>
        ) : null}

        <Text style={styles.hint}>
          Branche la voiture pour retrouver ces mêmes commandes à l'écran.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Info({
  label,
  value,
  border,
}: {
  label: string;
  value: string;
  border?: boolean;
}) {
  return (
    <View style={[styles.row, border && styles.rowBorder]}>
      <Text style={styles.rowName}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0b0b0f" },
  scroll: { paddingBottom: 40 },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 4 },
  title: { color: "#fff", fontSize: 32, fontWeight: "700" },
  subtitle: { color: "#8e8e93", fontSize: 14, marginTop: 4 },
  section: {
    color: "#8e8e93",
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 14,
    gap: 8,
  },
  tile: {
    width: "23%",
    aspectRatio: 0.92,
    backgroundColor: "#17171c",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tileWarn: { backgroundColor: "#2a1a1c" },
  tileIcon: { width: 30, height: 30, tintColor: "#fff", marginBottom: 8 },
  tileLabel: { color: "#d9d9de", fontSize: 11, textAlign: "center" },
  dimmed: { opacity: 0.35 },
  pressed: { opacity: 0.6 },
  card: {
    marginHorizontal: 16,
    backgroundColor: "#17171c",
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 12,
  },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#2c2c31" },
  rowIcon: { width: 24, height: 24, tintColor: "#0a84ff" },
  rowIconOff: { tintColor: "#5a5a60" },
  rowText: { flex: 1 },
  rowName: { color: "#fff", fontSize: 16, flexShrink: 1 },
  rowDetail: { color: "#8e8e93", fontSize: 13, marginTop: 2 },
  infoValue: { color: "#8e8e93", fontSize: 15, marginLeft: "auto", flexShrink: 1 },
  refresh: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 13,
    borderRadius: 12,
    backgroundColor: "#1c2733",
    alignItems: "center",
  },
  refreshLabel: { color: "#0a84ff", fontSize: 16, fontWeight: "600" },
  logTime: { color: "#5a5a60", fontSize: 13, width: 44 },
  logText: { color: "#d9d9de", fontSize: 14, flex: 1 },
  hint: {
    color: "#5a5a60",
    fontSize: 12,
    textAlign: "center",
    paddingHorizontal: 40,
    marginTop: 28,
  },
});
