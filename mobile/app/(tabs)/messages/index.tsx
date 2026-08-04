import CurrentUserGate from "../../../src/messages/CurrentUserGate";
import ConversationsListScreen from "../../../src/messages/ConversationsListScreen";

export default function MessagesIndexRoute() {
  return (
    <CurrentUserGate>
      <ConversationsListScreen />
    </CurrentUserGate>
  );
}
