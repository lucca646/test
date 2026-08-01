import { useState } from "react";
import { StyleSheet, View } from "react-native";
import TabScreen from "../components/TabScreen";
import DynamicIslandPlayground, {
  type IslandMode,
} from "../components/DynamicIslandPlayground";
import { useAppTheme } from "../lib/theme";

export default function TodayTab() {
  const [islandMode, setIslandMode] = useState<IslandMode>("timer");
  const theme = useAppTheme();

  return (
    <TabScreen
      kicker="CORAIA GLASS · FIX ÎLE"
      title="Aujourd'hui"
      body="Stop zombie : chaque mode = restart propre. Plus de carré violet (images off)."
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
