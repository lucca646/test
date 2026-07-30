import TabScreen from "../components/TabScreen";
import DeviceLab from "../components/apps/DeviceLab";

export default function AppsTab() {
  return (
    <TabScreen
      title="Apps"
      body="Zone de test : boutons, slider, tableau, recherche, Face ID, caméra, flash…"
      tint={["#34d399", "#059669"]}
      hideFooter
    >
      <DeviceLab />
    </TabScreen>
  );
}
