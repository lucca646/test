import MessagesAuthGate from "../../src/messages/MessagesAuthGate";
import ConversationsListScreen from "../../src/messages/ConversationsListScreen";

export default function MessagesIndexRoute() {
  return (
    <MessagesAuthGate>
      <ConversationsListScreen />
    </MessagesAuthGate>
  );
}
