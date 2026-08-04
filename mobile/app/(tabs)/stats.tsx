import CurrentUserGate from "../../src/messages/CurrentUserGate";
import StatsScreen from "../../src/messages/StatsScreen";

export default function StatsRoute() {
  return (
    <CurrentUserGate>
      <StatsScreen />
    </CurrentUserGate>
  );
}
