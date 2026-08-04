import CurrentUserGate from "../../src/messages/CurrentUserGate";
import ProfilScreen from "../../src/messages/ProfilScreen";

export default function ProfilRoute() {
  return (
    <CurrentUserGate>
      <ProfilScreen />
    </CurrentUserGate>
  );
}
