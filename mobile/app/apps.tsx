import TabScreen from "../components/TabScreen";
import DeviceLab from "../components/apps/DeviceLab";

export default function AppsTab() {
  return (
    <TabScreen
      title="Apps"
      body="Zone de test : Face ID, caméra/flash, notifications. UI adaptative clair/sombre."
      tint={["#34d399", "#059669"]}
      hideFooter
    >
      <DeviceLab />
    </TabScreen>
  );
}
