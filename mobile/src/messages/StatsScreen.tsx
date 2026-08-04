import { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getStats, type StatsPayload } from "./api";
import { EmptyState, SectionHeader } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";

function KpiCard({ label, value, color }: { label: string; value: string; color: string }) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[styles.cardValue, { color }]}>{value}</Text>
      <Text style={[styles.cardLabel, { color: c.muted }]}>{label}</Text>
    </View>
  );
}

const pct = (v: number | null) => (v == null ? "—" : `${Math.round(v * 100)}%`);

export default function StatsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await getStats({ sim: "all" });
      setStats(data);
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
      <Text style={[styles.largeTitle, { color: c.text }]}>Stats</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        {stats ? `${stats.from} → ${stats.to} · 7 derniers jours` : "Chargement…"}
      </Text>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : error ? (
        <EmptyState title="Impossible de charger les stats" subtitle={error} />
      ) : !stats ? null : (
        <>
          <SectionHeader title="Volume" />
          <View style={styles.grid}>
            <KpiCard label="Reçus" value={String(stats.kpis.inbound)} color={c.accent} />
            <KpiCard label="Envoyés" value={String(stats.kpis.outbound)} color={c.accent} />
            <KpiCard label="Contactés" value={String(stats.kpis.peopleContacted)} color={c.text} />
            <KpiCard label="Nouveaux" value={String(stats.kpis.newContacts)} color={c.text} />
          </View>

          <SectionHeader title="Engagement" />
          <View style={styles.grid}>
            <KpiCard label="Taux de réponse" value={pct(stats.kpis.replyRate)} color={c.success} />
            <KpiCard label="RDV période" value={String(stats.kpis.rdvInPeriod)} color={c.success} />
            <KpiCard label="Gagnés" value={String(stats.kpis.gagne)} color={c.success} />
            <KpiCard
              label="Msg / contact"
              value={stats.kpis.messagesPerContact != null ? String(stats.kpis.messagesPerContact) : "—"}
              color={c.text}
            />
          </View>

          <SectionHeader title="Coûts" />
          <View style={styles.grid}>
            <KpiCard label="Coût total" value={`${stats.costs.total.toFixed(2)} $`} color={c.warning} />
            <KpiCard
              label="Coût / gagné"
              value={stats.costs.costPerGagne != null ? `${stats.costs.costPerGagne.toFixed(2)} $` : "—"}
              color={c.warning}
            />
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginHorizontal: 16,
  },
  sub: { fontSize: 14, marginHorizontal: 16, marginBottom: 4 },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginHorizontal: 16,
    marginTop: 8,
  },
  card: {
    flexGrow: 1,
    flexBasis: "45%",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 4,
  },
  cardValue: { fontSize: 24, fontWeight: "800", letterSpacing: -0.5 },
  cardLabel: { fontSize: 13 },
});
