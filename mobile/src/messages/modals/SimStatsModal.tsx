import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { getSimLimits, type SimLimits, type SimStatus } from "../api";
import { formatCost } from "../format";
import { EmptyState } from "../../ui/Apple";
import { useColors } from "../../theme";

function usageRatio(used: number, max: number | null): number {
  if (max == null || max <= 0) return 0;
  return Math.max(0, Math.min(1, used / max));
}

/** Vert → jaune → rouge selon le taux d'utilisation (même dégradé que la PWA). */
function usageGaugeColor(ratio: number): string {
  const t = Math.max(0, Math.min(1, ratio));
  let r: number;
  let g: number;
  let b: number;
  if (t <= 0.55) {
    const u = t / 0.55;
    r = Math.round(52 + (255 - 52) * u);
    g = Math.round(199 + (204 - 199) * u);
    b = Math.round(89 + (0 - 89) * u);
  } else {
    const u = (t - 0.55) / 0.45;
    r = 255;
    g = Math.round(204 + (59 - 204) * u);
    b = Math.round(0 + (48 - 0) * u);
  }
  return `rgb(${r}, ${g}, ${b})`;
}

function Gauge({
  label,
  used,
  max,
  remaining,
}: {
  label: string;
  used: number;
  max: number | null;
  remaining?: number | null;
}) {
  const c = useColors();
  const ratio = usageRatio(used, max);
  const pct = Math.round(ratio * 100);
  const color = max != null ? usageGaugeColor(ratio) : c.muted;
  return (
    <View style={styles.gauge}>
      <View style={styles.gaugeHead}>
        <Text style={[styles.gaugeLabel, { color: c.text }]} numberOfLines={1}>
          {label} · {used}
          {max != null ? ` / ${max}` : ""}
          {remaining != null ? ` · reste ${remaining}` : ""}
        </Text>
        {max != null ? (
          <Text style={[styles.gaugePct, { color: c.muted }]}>{pct}%</Text>
        ) : null}
      </View>
      <View style={[styles.gaugeTrack, { backgroundColor: c.searchBg }]}>
        <View
          style={[
            styles.gaugeFill,
            { width: max != null ? `${Math.max(4, pct)}%` : "100%", backgroundColor: color },
          ]}
        />
      </View>
    </View>
  );
}

/** Stats du jour pour une SIM — équivalent du popover limites de la PWA. */
export default function SimStatsModal({
  visible,
  sim,
  onClose,
}: {
  visible: boolean;
  sim: SimStatus | null;
  onClose: () => void;
}) {
  const c = useColors();
  const [limits, setLimits] = useState<SimLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !sim) return;
    setLoading(true);
    setError(null);
    getSimLimits(sim.id)
      .then(setLimits)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [visible, sim]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>
            {sim?.label || "SIM"} · Aujourd'hui
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: c.accent }]}>Fermer</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : error || !limits ? (
          <EmptyState title="Indisponible" subtitle={error || undefined} />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {sim ? (
              <View style={[styles.infoCard, { backgroundColor: c.card, borderColor: c.border }]}>
                <View style={styles.infoRow}>
                  <View
                    style={[
                      styles.statusDot,
                      { backgroundColor: sim.connected ? c.success : c.danger },
                    ]}
                  />
                  <Text style={[styles.infoText, { color: c.text }]}>
                    {sim.connected ? "Connectée" : "Hors ligne"}
                    {sim.ownNumber ? ` · ${sim.ownNumber}` : ""}
                  </Text>
                </View>
                {sim.network || sim.signal ? (
                  <Text style={[styles.infoSub, { color: c.muted }]}>
                    {[sim.network, sim.signal].filter(Boolean).join(" · ")}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <Gauge
              label="Messages"
              used={limits.usage.messagesSent}
              max={limits.limits.maxMessagesPerDay}
              remaining={limits.remaining.messages}
            />
            <Gauge
              label="Nouv. conv."
              used={limits.usage.newConversations}
              max={limits.limits.maxNewConversationsPerDay}
              remaining={limits.remaining.newConversations}
            />

            <View style={[styles.costCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={styles.costRow}>
                <Text style={[styles.costLabel, { color: c.muted }]}>Coût API · journée</Text>
                <Text style={[styles.costValue, { color: c.warning }]}>
                  {formatCost(limits.apiCostDay)}
                </Text>
              </View>
              <View style={[styles.costRow, { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.separator, paddingTop: 10, marginTop: 10 }]}>
                <Text style={[styles.costLabel, { color: c.muted }]}>Coût API · total</Text>
                <Text style={[styles.costValue, { color: c.warning }]}>
                  {formatCost(limits.apiCostLifetime)}
                </Text>
              </View>
            </View>

            <Text style={[styles.meta, { color: c.muted }]}>
              {limits.day} · fuseau {limits.timezone}
            </Text>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  headerBtn: { fontSize: 16 },
  list: { padding: 16, gap: 16 },
  infoCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
    gap: 4,
  },
  infoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  infoText: { fontSize: 15, fontWeight: "600" },
  infoSub: { fontSize: 13 },
  gauge: { gap: 6 },
  gaugeHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  gaugeLabel: { fontSize: 14, fontWeight: "600", flex: 1 },
  gaugePct: { fontSize: 13, fontWeight: "600" },
  gaugeTrack: { height: 10, borderRadius: 5, overflow: "hidden" },
  gaugeFill: { height: "100%", borderRadius: 5 },
  costCard: {
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 14,
  },
  costRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  costLabel: { fontSize: 14 },
  costValue: { fontSize: 16, fontWeight: "700" },
  meta: { fontSize: 12, textAlign: "center" },
});
