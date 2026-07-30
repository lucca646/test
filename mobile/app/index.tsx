import TabScreen from "../components/TabScreen";

export default function TodayTab() {
  return (
    <TabScreen
      title="Aujourd'hui"
      body="Onglet natif iOS — la barre en bas est la vraie UITabBar Apple, pas un fake React Native."
      tint={["#3b82f6", "#1d4ed8"]}
    />
  );
}
