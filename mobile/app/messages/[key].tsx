import MessagesAuthGate from "../../src/messages/MessagesAuthGate";
import ThreadScreen from "../../src/messages/ThreadScreen";

export default function MessagesThreadRoute() {
  return (
    <MessagesAuthGate>
      <ThreadScreen />
    </MessagesAuthGate>
  );
}
