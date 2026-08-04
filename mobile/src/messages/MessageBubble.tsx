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
  // Même règle que la PWA : un envoi sortant sans `sentBy` explicite est
  // considéré comme envoyé par le bot (vs "ui" = envoi manuel depuis l'app).
  const isBot = isOut && message.sentBy !== "ui";

  return (
    <View style={[styles.wrap, isOut ? styles.wrapOut : styles.wrapIn]}>
      <View
        style={[
          styles.bubble,
          isOut
            ? {
                backgroundColor: isBot ? c.bubbleBot : c.accent,
                borderBottomRightRadius: 4,
              }
            : { backgroundColor: c.bubbleIn, borderBottomLeftRadius: 4 },
        ]}
      >
        <Text style={[styles.text, { color: isOut ? "#fff" : c.text }]}>{text}</Text>
        {message.reaction ? (
          <View
            style={[
              styles.reaction,
              isOut ? styles.reactionOut : styles.reactionIn,
              { borderColor: c.bg },
            ]}
          >
            <Text style={styles.reactionText}>{message.reaction}</Text>
          </View>
        ) : null}
      </View>
      {showStatus ? (
        <Text style={[styles.status, { color: c.muted }]}>
          {isOut ? `Distribué · ${formatBubbleTime(message.date)}` : formatBubbleTime(message.date)}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginVertical: 2, maxWidth: "72%" },
  wrapOut: { alignSelf: "flex-end", alignItems: "flex-end" },
  wrapIn: { alignSelf: "flex-start", alignItems: "flex-start" },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  text: { fontSize: 16, lineHeight: 21 },
  status: { fontSize: 11, marginTop: 3, marginHorizontal: 4 },
  reaction: {
    position: "absolute",
    top: -14,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    backgroundColor: "#34c759",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.28,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  reactionOut: { left: -8 },
  reactionIn: { right: -8 },
  reactionText: { fontSize: 13 },
});
