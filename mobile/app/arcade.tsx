import TabScreen from "../components/TabScreen";

export default function ArcadeTab() {
  return (
    <TabScreen
      title="Arcade"
      body="role / comportement natifs gérés par UIKit, pas par notre JS."
      tint={["#a78bfa", "#7c3aed"]}
    />
  );
}
