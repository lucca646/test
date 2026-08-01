import { useEffect, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import TabScreen from "../components/TabScreen";
import DynamicIslandPlayground, {
  type IslandMode,
} from "../components/DynamicIslandPlayground";
import { useAppTheme } from "../lib/theme";

const MODES: IslandMode[] = [
  "timer",
  "music",
  "progress",
  "focus",
  "breathe",
  "score",
];

function parseGuide(raw: string | string[] | undefined): IslandMode | null {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (!v) return null;
  return MODES.includes(v as IslandMode) ? (v as IslandMode) : null;
}

export default function TodayTab() {
  const theme = useAppTheme();
  const params = useLocalSearchParams<{ guide?: string | string[] }>();
  const initialGuide = useMemo(
    () => parseGuide(params.guide),
    [params.guide],
  );
  const [islandMode, setIslandMode] = useState<IslandMode>(
    initialGuide ?? "breathe",
  );

  useEffect(() => {
    if (initialGuide) setIslandMode(initialGuide);
  }, [initialGuide]);

  return (
    <TabScreen
      kicker="CORAIA GLASS · GUIDE FR"
      title="Aujourd'hui"
      body="Tape « Comprendre » ou l’île elle-même : chaque mode s’explique en français."
      tint={["#5E5CE6", "#0A84FF"]}
    >
      <View
        style={[
          styles.islandCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.cardBorder,
          },
        ]}
      >
        <DynamicIslandPlayground
          mode={islandMode}
          onChange={setIslandMode}
          initialGuide={initialGuide}
        />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  islandCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
