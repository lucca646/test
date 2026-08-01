import { useState } from "react";
import { StyleSheet, View } from "react-native";
import AppErrorBoundary from "../components/AppErrorBoundary";
import TabScreen from "../components/TabScreen";
import DynamicIslandPlayground, {
  type IslandMode,
} from "../components/DynamicIslandPlayground";
import { useAppTheme } from "../lib/theme";

export default function TodayTab() {
  const theme = useAppTheme();
  const [islandMode, setIslandMode] = useState<IslandMode>("breathe");

  return (
    <TabScreen
      kicker="OTA NAV · TEINTE + BADGE + ICÔNES"
      title="Aujourd'hui"
      body="Barre modifiée sans rebuild : tint cyan, icône soleil, badge OTA sur Apps. Si tu vois ça, l’OTA a marché."
      tint={["#FF453A", "#5E5CE6"]}
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
        <AppErrorBoundary label="DynamicIsland">
          <DynamicIslandPlayground
            mode={islandMode}
            onChange={setIslandMode}
          />
        </AppErrorBoundary>
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
