import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { HOME } from "app-nav";
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
      kicker={HOME.kicker}
      title={HOME.title}
      body={HOME.body}
      tint={HOME.tint as [string, string]}
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
