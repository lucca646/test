import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useColors } from "../theme";

/**
 * Petits graphiques 100% JS (Views, pas de SVG natif) pour rester
 * compatible OTA — le projet n'embarque pas `react-native-svg` dans le
 * dernier build natif, l'ajouter casserait les mises à jour OTA.
 */

export type BarSeries = { value: number; color: string };
export type BarChartDatum = { label: string; series: BarSeries[] };

export function BarChart({
  data,
  height = 130,
  barWidth = 9,
  legend,
  formatValue,
}: {
  data: BarChartDatum[];
  height?: number;
  barWidth?: number;
  legend?: { label: string; color: string }[];
  formatValue?: (value: number) => string;
}) {
  const c = useColors();
  const max = Math.max(1, ...data.flatMap((d) => d.series.map((s) => s.value)));

  return (
    <View>
      {legend && legend.length > 0 ? (
        <View style={styles.legendRow}>
          {legend.map((l) => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: l.color }]} />
              <Text style={[styles.legendLabel, { color: c.muted }]}>{l.label}</Text>
            </View>
          ))}
        </View>
      ) : null}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chartScroll}
      >
        {data.map((d, i) => {
          const total = d.series.reduce((s, x) => s + x.value, 0);
          return (
            <View key={i} style={styles.col}>
              <View style={[styles.barsGroup, { height }]}>
                {d.series.map((s, j) => (
                  <View
                    key={j}
                    style={[
                      styles.bar,
                      {
                        width: barWidth,
                        backgroundColor: s.color,
                        height: Math.max(2, (s.value / max) * height),
                      },
                    ]}
                  />
                ))}
              </View>
              {formatValue ? (
                <Text style={[styles.colValue, { color: c.text }]} numberOfLines={1}>
                  {formatValue(total)}
                </Text>
              ) : null}
              <Text style={[styles.colLabel, { color: c.muted }]} numberOfLines={1}>
                {d.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function HorizontalBarChart({
  data,
}: {
  data: { label: string; value: number; color: string }[];
}) {
  const c = useColors();
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <View style={styles.hChart}>
      {data.map((d, i) => (
        <View key={`${d.label}-${i}`} style={styles.hRow}>
          <Text style={[styles.hLabel, { color: c.text }]} numberOfLines={1}>
            {d.label}
          </Text>
          <View style={[styles.hTrack, { backgroundColor: c.searchBg }]}>
            <View
              style={[
                styles.hFill,
                {
                  width: `${Math.max(3, (d.value / max) * 100)}%`,
                  backgroundColor: d.color,
                },
              ]}
            />
          </View>
          <Text style={[styles.hValue, { color: c.muted }]}>{d.value}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  legendRow: {
    flexDirection: "row",
    gap: 16,
    marginHorizontal: 16,
    marginBottom: 10,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: 12, fontWeight: "600" },
  chartScroll: { paddingHorizontal: 16, alignItems: "flex-end", gap: 12 },
  col: { alignItems: "center", width: 34 },
  barsGroup: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "center",
    gap: 3,
  },
  bar: { borderRadius: 3 },
  colValue: { fontSize: 10, fontWeight: "700", marginTop: 6 },
  colLabel: { fontSize: 10, marginTop: 1 },
  hChart: { marginHorizontal: 16, gap: 12 },
  hRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  hLabel: { fontSize: 14, width: 96 },
  hTrack: {
    flex: 1,
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
  },
  hFill: { height: "100%", borderRadius: 5 },
  hValue: { fontSize: 13, fontWeight: "600", width: 30, textAlign: "right" },
});
