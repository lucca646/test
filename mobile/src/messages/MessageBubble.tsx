import { StyleSheet, Text, View } from "react-native";
import { useColors } from "../theme";
import type { ConversationMessage } from "./api";
import { formatBubbleTime } from "./format";

export default function MessageBubble({
  message,
  showStatus,
}: {
  message: ConversationMessage;
  showStatus?: boolean;
}) {
  const c = useColors();
  const isOut = message.direction === "out";
  const text = message.content || message.text || "";

  return (
    <View style={[styles.wrap, isOut ? styles.wrapOut : styles.wrapIn]}>
      <View
        style={[
          styles.bubble,
          isOut
            ? { backgroundColor: c.accent, borderBottomRightRadius: 4 }
            : { backgroundColor: c.card, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={[styles.text, { color: isOut ? "#fff" : c.text }]}>{text}</Text>
      </View>
      {showStatus ? (
        <Text style={[styles.status, { color: c.muted }]}>
          {isOut
            ? message.status === "lu"
              ? `Lu · ${formatBubbleTime(message.date)}`
              : `Envoyé · ${formatBubbleTime(message.date)}`
            : formatBubbleTime(message.date)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 2, maxWidth: "78%" },
  wrapOut: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapIn: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  text: { fontSize: 16, lineHeight: 21 },
  status: { fontSize: 11, marginTop: 3, marginHorizontal: 4 },
});
