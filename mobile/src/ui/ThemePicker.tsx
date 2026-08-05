import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "../theme";
import { THEME_PRESETS } from "../messages/themePresets";
import type { ThemePresetId } from "../messages/AppearanceContext";

/**
 * Grille de thèmes (Paramètres → Thème) — chaque carte montre un aperçu à 4
 * pastilles façon coolors.co ; tap = applique le thème à toute l'app
 * (`theme.ts` dérive fond/accent/pastilles depuis `accentLight`/`accentDark`).
 */
export function ThemePicker({
  value,
  onChange,
}: {
  value: ThemePresetId;
  onChange: (id: ThemePresetId) => void;
}) {
  const c = useColors();
  return (
    <View style={styles.grid}>
      {THEME_PRESETS.map((preset) => {
        const selected = preset.id === value;
        return (
          <Pressable
            key={preset.id}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(preset.id);
            }}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: c.card,
                borderColor: selected ? preset.accentLight : c.border,
                borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <View style={styles.swatchRow}>
              {preset.swatches.map((hex, i) => (
                <View key={i} style={[styles.swatch, { backgroundColor: hex }]} />
              ))}
            </View>
            <View style={styles.cardFooter}>
              <Text style={[styles.cardLabel, { color: c.text }]} numberOfLines={1}>
                {preset.name}
              </Text>
              {selected ? (
                <Ionicons name="checkmark-circle" size={18} color={preset.accentLight} />
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginHorizontal: 16,
  },
  card: {
    width: "31%",
    borderRadius: 14,
    padding: 8,
    gap: 8,
  },
  swatchRow: {
    flexDirection: "row",
    borderRadius: 8,
    overflow: "hidden",
    height: 40,
  },
  swatch: { flex: 1 },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardLabel: { fontSize: 13, fontWeight: "600", flex: 1 },
});
