import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listSims, type SimStatus } from "./api";
import { Group, Row, SectionHeader } from "../ui/Apple";
import { MESSAGES_API_URL } from "../config";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";
import { otaDebugLabel } from "../../lib/ota";

export default function ParametresScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [sims, setSims] = useState<SimStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      setSims(await listSims());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8) + 4,
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
      }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
      }
    >
      <Text style={[styles.largeTitle, { color: c.text }]}>Paramètres</Text>

      <SectionHeader title="SIMs" />
      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 12 }} />
      ) : error ? (
        <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
      ) : (
        <Group>
          {sims.length === 0 ? (
            <Row label="Aucune SIM" last />
          ) : (
            sims.map((sim, i) => (
              <Row
                key={sim.id}
                label={`${sim.label}${sim.ownNumber ? ` · ${sim.ownNumber}` : ""}`}
                value={sim.connected ? "Connectée" : "Hors ligne"}
                accentValue={sim.connected}
                last={i === sims.length - 1}
              />
            ))
          )}
        </Group>
      )}

      <SectionHeader title="Application" />
      <Group>
        <Row label="API Messages" value={MESSAGES_API_URL.replace(/^https?:\/\//, "")} />
        <Row label="Build" value={otaDebugLabel()} last />
      </Group>

      <SectionHeader title="Notifications" />
      <Group>
        <Row label="Push (bientôt)" value="—" last />
      </Group>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  error: { marginHorizontal: 16, fontSize: 14 },
});
