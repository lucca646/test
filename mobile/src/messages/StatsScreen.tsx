import { useCallback, useMemo, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getStats, listSims, type SimStatus, type StatsPayload } from "./api";
import { EmptyState, Group, Row, SectionHeader, Segmented } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";

const ALL_SIM = "all";

const PERIODS = [
  { id: "7", label: "7 j" },
  { id: "14", label: "14 j" },
  { id: "30", label: "30 j" },
  { id: "month", label: "Ce mois" },
];

const CATEGORIES = [
  { id: "overview", label: "Vue d'ensemble" },
  { id: "volume", label: "Volume" },
  { id: "funnel", label: "Funnel" },
  { id: "rdv", label: "RDV" },
];

function calendarDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function rangeForPeriod(periodId: string): { from: string; to: string } {
  const today = new Date();
  const to = calendarDay(today);
  if (periodId === "month") {
    const first = new Date(today.getFullYear(), today.getMonth(), 1);
    return { from: calendarDay(first), to };
  }
  const days = Number(periodId) || 7;
  const from = new Date(today);
  from.setDate(from.getDate() - (days - 1));
  return { from: calendarDay(from), to };
}

function formatDayLabel(day: string): string {
  const d = new Date(`${day}T12:00:00.000Z`);
  if (Number.isNaN(d.getTime())) return day;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

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

function OverviewTab({ stats }: { stats: StatsPayload }) {
  const c = useColors();
  return (
    <>
      <SectionHeader title="Volume" />
      <View style={styles.grid}>
        <KpiCard label="Reçus" value={String(stats.kpis.inbound)} color={c.accent} />
        <KpiCard label="Envoyés" value={String(stats.kpis.outbound)} color={c.accent} />
        <KpiCard label="Contactés" value={String(stats.kpis.peopleContacted)} color={c.text} />
        <KpiCard label="Nouveaux contacts" value={String(stats.kpis.newContacts)} color={c.text} />
        <KpiCard label="Nouvelles conv." value={String(stats.kpis.newConversations)} color={c.text} />
        <KpiCard label="Contacts actifs" value={String(stats.kpis.activeContacts)} color={c.text} />
      </View>

      <SectionHeader title="Envois" />
      <View style={styles.grid}>
        <KpiCard label="Via bot" value={String(stats.kpis.outboundBot)} color={c.accent} />
        <KpiCard label="Manuels (UI)" value={String(stats.kpis.outboundUi)} color={c.accent} />
      </View>

      <SectionHeader title="Engagement" />
      <View style={styles.grid}>
        <KpiCard label="Taux de réponse" value={pct(stats.kpis.replyRate)} color={c.success} />
        <KpiCard label="Ont répondu" value={String(stats.kpis.peopleReplied)} color={c.success} />
        <KpiCard
          label="Latence moy."
          value={
            stats.kpis.avgReplyLatencySec != null
              ? `${Math.round(stats.kpis.avgReplyLatencySec / 60)} min`
              : "—"
          }
          color={c.text}
        />
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
          label="Coût / envoi facturé"
          value={
            stats.costs.avgPerPricedOutbound != null
              ? `${stats.costs.avgPerPricedOutbound.toFixed(3)} $`
              : "—"
          }
          color={c.warning}
        />
        <KpiCard
          label="Coût / gagné"
          value={stats.costs.costPerGagne != null ? `${stats.costs.costPerGagne.toFixed(2)} $` : "—"}
          color={c.warning}
        />
      </View>
    </>
  );
}

function VolumeTab({ stats }: { stats: StatsPayload }) {
  const c = useColors();
  const series = stats.volume.series;
  return (
    <>
      <SectionHeader title="Volume période" />
      <View style={styles.grid}>
        <KpiCard label="Reçus" value={String(stats.volume.inbound)} color={c.accent} />
        <KpiCard label="Envoyés" value={String(stats.volume.outbound)} color={c.accent} />
        <KpiCard label="Via bot" value={String(stats.volume.outboundBot)} color={c.text} />
        <KpiCard label="Manuels (UI)" value={String(stats.volume.outboundUi)} color={c.text} />
      </View>

      <SectionHeader title="Volume par jour" />
      {series.length === 0 ? (
        <Text style={[styles.emptyText, { color: c.muted }]}>Aucune donnée sur la période.</Text>
      ) : (
        <Group>
          {series.map((day, i) => (
            <Row
              key={day.day}
              label={formatDayLabel(day.day)}
              value={`${day.inbound} in · ${day.outbound} out · ${day.cost.toFixed(2)} $`}
              last={i === series.length - 1}
            />
          ))}
        </Group>
      )}
    </>
  );
}

function FunnelTab({ stats }: { stats: StatsPayload }) {
  const c = useColors();
  const byCategory = stats.funnel.byCategory;
  const byLabel = stats.funnel.byLabel;
  return (
    <>
      <SectionHeader title="Par catégorie" />
      {byCategory.length === 0 ? (
        <Text style={[styles.emptyText, { color: c.muted }]}>Aucune catégorie.</Text>
      ) : (
        <Group>
          {byCategory.map((row, i) => (
            <Row
              key={row.category}
              label={row.label}
              value={String(row.count)}
              last={i === byCategory.length - 1}
            />
          ))}
        </Group>
      )}

      <SectionHeader title="Par étiquette" />
      {byLabel.length === 0 ? (
        <Text style={[styles.emptyText, { color: c.muted }]}>Aucune étiquette.</Text>
      ) : (
        <Group>
          {byLabel.map((row, i) => (
            <Row
              key={row.name}
              label={row.name}
              value={String(row.count)}
              last={i === byLabel.length - 1}
            />
          ))}
        </Group>
      )}
    </>
  );
}

function RdvTab({ stats }: { stats: StatsPayload }) {
  const c = useColors();
  const rdvByDay = stats.conversion.rdvByDay.filter((d) => d.count > 0);
  return (
    <>
      <SectionHeader title="Conversion" />
      <View style={styles.grid}>
        <KpiCard label="Gagnés" value={String(stats.conversion.gagne)} color={c.success} />
        <KpiCard label="RDV période" value={String(stats.conversion.rdvInPeriod)} color={c.success} />
        <KpiCard label="RDV à venir" value={String(stats.conversion.rdvUpcoming)} color={c.text} />
        <KpiCard label="RDV passés" value={String(stats.conversion.rdvPast)} color={c.text} />
        <KpiCard
          label="Taux vs contactés"
          value={pct(stats.conversion.rateVsContacted)}
          color={c.success}
        />
        <KpiCard
          label="Coût / gagné"
          value={
            stats.conversion.costPerGagne != null
              ? `${stats.conversion.costPerGagne.toFixed(2)} $`
              : "—"
          }
          color={c.warning}
        />
      </View>

      <SectionHeader title="RDV réservés par jour" />
      {rdvByDay.length === 0 ? (
        <Text style={[styles.emptyText, { color: c.muted }]}>Aucun RDV réservé sur la période.</Text>
      ) : (
        <Group>
          {rdvByDay.map((row, i) => (
            <Row
              key={row.day}
              label={formatDayLabel(row.day)}
              value={String(row.count)}
              last={i === rdvByDay.length - 1}
            />
          ))}
        </Group>
      )}
    </>
  );
}

export default function StatsScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [stats, setStats] = useState<StatsPayload | null>(null);
  const [sims, setSims] = useState<SimStatus[]>([]);
  const [period, setPeriod] = useState("7");
  const [simFilter, setSimFilter] = useState(ALL_SIM);
  const [category, setCategory] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const range = useMemo(() => rangeForPeriod(period), [period]);

  const load = useCallback(
    async (silent = false, opts?: { period?: string; sim?: string }) => {
      if (!silent) setLoading(true);
      try {
        const { from, to } = rangeForPeriod(opts?.period ?? period);
        const sim = opts?.sim ?? simFilter;
        const data = await getStats({ sim, from, to });
        setStats(data);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [period, simFilter],
  );

  useFocusEffect(
    useCallback(() => {
      void load();
      void listSims().then(setSims).catch(() => {});
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const onChangePeriod = (id: string) => {
    setPeriod(id);
    void load(false, { period: id });
  };

  const onChangeSim = (id: string) => {
    setSimFilter(id);
    void load(false, { sim: id });
  };

  const simOptions = [
    { id: ALL_SIM, label: "Toutes" },
    ...sims.map((s) => ({ id: s.id, label: s.label })),
  ];

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
        {stats ? `${stats.from} → ${stats.to}` : `${range.from} → ${range.to}`}
      </Text>

      <View style={styles.filterWrap}>
        <Segmented options={PERIODS} value={period} onChange={onChangePeriod} />
      </View>
      {sims.length > 1 ? (
        <View style={styles.filterWrap}>
          <Segmented options={simOptions} value={simFilter} onChange={onChangeSim} />
        </View>
      ) : null}
      <View style={styles.filterWrap}>
        <Segmented options={CATEGORIES} value={category} onChange={setCategory} />
      </View>

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : error ? (
        <EmptyState title="Impossible de charger les stats" subtitle={error} />
      ) : !stats ? null : category === "volume" ? (
        <VolumeTab stats={stats} />
      ) : category === "funnel" ? (
        <FunnelTab stats={stats} />
      ) : category === "rdv" ? (
        <RdvTab stats={stats} />
      ) : (
        <OverviewTab stats={stats} />
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
  filterWrap: { marginTop: 6, marginBottom: 6 },
  emptyText: { fontSize: 14, marginHorizontal: 16, marginTop: 4 },
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
