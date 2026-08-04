import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listSims, type SimStatus } from "./api";
import { useAppearance, type AppearanceMode } from "./AppearanceContext";
import { Group, Row, Segmented, SectionHeader } from "../ui/Apple";
import { MESSAGES_API_URL } from "../config";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";
import { otaDebugLabel } from "../../lib/ota";

const APPEARANCE_OPTIONS: { id: AppearanceMode; label: string }[] = [
  { id: "system", label: "Système" },
  { id: "light", label: "Clair" },
  { id: "dark", label: "Sombre" },
];

export default function ParametresScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { mode, setMode } = useAppearance();
  const [sims, setSims] = useState<SimStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notifEnabled, setNotifEnabled] = useState(false);

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
            <Row
              label="Aucune SIM"
              icon={{ name: "cellular-outline", backgroundColor: c.muted }}
              last
            />
          ) : (
            sims.map((sim, i) => (
              <Row
                key={sim.id}
                icon={{
                  name: "cellular-outline",
                  backgroundColor: sim.connected ? c.success : c.danger,
                }}
                label={sim.label}
                subtitle={sim.ownNumber ?? undefined}
                value={sim.connected ? "Connectée" : "Hors ligne"}
                accentValue={sim.connected}
                last={i === sims.length - 1}
              />
            ))
          )}
        </Group>
      )}

      <SectionHeader title="Apparence" />
      <View style={styles.appearanceWrap}>
        <Segmented
          options={APPEARANCE_OPTIONS}
          value={mode}
          onChange={(id) => setMode(id as AppearanceMode)}
        />
      </View>

      <SectionHeader title="Notifications" />
      <Group>
        <Row
          label="Notifications push"
          subtitle="Bientôt disponible"
          icon={{ name: "notifications", backgroundColor: c.danger }}
          switchValue={notifEnabled}
          onSwitchChange={setNotifEnabled}
          switchDisabled
          last
        />
      </Group>

      <SectionHeader title="Application" />
      <Group>
        <Row
          label="API Messages"
          icon={{ name: "globe-outline", backgroundColor: c.accent }}
          value={MESSAGES_API_URL.replace(/^https?:\/\//, "")}
        />
        <Row
          label="Build"
          icon={{ name: "construct-outline", backgroundColor: "#8e8e93" }}
          value={otaDebugLabel()}
          last
        />
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
  appearanceWrap: { marginBottom: 6 },
});
