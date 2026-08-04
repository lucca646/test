import CurrentUserGate from "../../src/messages/CurrentUserGate";
import ThreadScreen from "../../src/messages/ThreadScreen";

export default function MessagesThreadRoute() {
  return (
    <CurrentUserGate>
      <ThreadScreen />
    </CurrentUserGate>
  );
}
