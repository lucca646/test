import TabScreen from "../components/TabScreen";

export default function ArcadeTab() {
  return (
    <TabScreen
      title="Arcade"
      body="role / comportement natifs gérés par UIKit. Le fond suit le mode clair/sombre système."
      tint={["#a78bfa", "#7c3aed"]}
    />
  );
}
