import { useState } from "react";
import { StyleSheet, View } from "react-native";
import TabScreen from "../components/TabScreen";
import DynamicIslandPlayground, {
  type IslandMode,
} from "../components/DynamicIslandPlayground";
import { useAppTheme } from "../lib/theme";

export default function TodayTab() {
  const [islandMode, setIslandMode] = useState<IslandMode>("focus");
  const theme = useAppTheme();

  return (
    <TabScreen
      kicker="CORAIA GLASS · ÎLE LIVE"
      title="Aujourd'hui"
      body="Focus · Breathe · Score en autopilot sur la Dynamic Island — MAJ OTA sans rebuild."
      tint={["#3b82f6", "#1d4ed8"]}
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
        <DynamicIslandPlayground mode={islandMode} onChange={setIslandMode} />
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
