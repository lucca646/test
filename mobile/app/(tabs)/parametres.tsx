import CurrentUserGate from "../../src/messages/CurrentUserGate";
import ParametresScreen from "../../src/messages/ParametresScreen";

export default function ParametresRoute() {
  return (
    <CurrentUserGate>
      <ParametresScreen />
    </CurrentUserGate>
  );
}
