import { useState } from "react";
import { StyleSheet, View } from "react-native";
import TabScreen from "../components/TabScreen";
import DynamicIslandPlayground, {
  type IslandMode,
} from "../components/DynamicIslandPlayground";

export default function TodayTab() {
  const [islandMode, setIslandMode] = useState<IslandMode>("compact");

  return (
    <TabScreen
      title="Aujourd'hui"
      body="Onglet natif iOS — UITabBar Apple en bas. En dessous : options Dynamic Island."
      tint={["#3b82f6", "#1d4ed8"]}
    >
      <View style={styles.islandCard}>
        <DynamicIslandPlayground mode={islandMode} onChange={setIslandMode} />
      </View>
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  islandCard: {
    borderRadius: 20,
    padding: 18,
    backgroundColor: "rgba(28,28,30,0.72)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
});
