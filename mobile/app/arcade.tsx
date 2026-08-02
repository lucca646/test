import TabScreen from "../components/TabScreen";

export default function ArcadeTab() {
  return (
    <TabScreen
      title="Arcade"
      body="Onglet Arcade — dock split partagé avec le web (app-nav). Le fond suit le mode clair/sombre système."
      tint={["#a78bfa", "#7c3aed"]}
    />
  );
}
