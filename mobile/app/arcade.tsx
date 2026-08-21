import TabScreen from "../components/TabScreen";
import CarAudioPlayer from "../components/CarAudioPlayer";

export default function ArcadeTab() {
  return (
    <TabScreen
      kicker="AUDIO · NOW PLAYING CARPLAY"
      title="Radio Coraia"
      body="Lance la lecture puis branche ton iPhone en CarPlay : l'app apparaît sur l'écran Now Playing de la voiture (titre, pochette, play/pause). Sans entitlement Apple."
      tint={["#a78bfa", "#7c3aed"]}
      hideFooter
    >
      <CarAudioPlayer />
    </TabScreen>
  );
}
