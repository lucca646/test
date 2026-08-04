import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "../theme";
import type { ConversationSummary } from "./api";
import { avatarColor, formatDisplayPhone, formatListTimestamp, initials, labelColor } from "./format";

export default function ConversationRow({
  conversation,
  onPress,
}: {
  conversation: ConversationSummary;
  onPress: () => void;
}) {
  const c = useColors();
  const unread = conversation.unread_count > 0;
  const displayName =
    conversation.name && conversation.name !== conversation.phone
      ? conversation.name
      : formatDisplayPhone(conversation.phone);
  const preview =
    conversation.last_direction === "out"
      ? `Vous : ${conversation.last_message || ""}`
      : conversation.last_message || "";
  const labels = conversation.labels || [];

  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: c.separator },
        pressed && { backgroundColor: c.rowPressed },
      ]}
    >
      {unread ? <View style={[styles.unreadDot, { backgroundColor: c.accent }]} /> : null}
      <View style={[styles.avatar, { backgroundColor: avatarColor(conversation.phone) }]}>
        <Text style={styles.avatarText}>{initials(conversation.name || conversation.phone)}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.topLine}>
          <Text
            style={[
              styles.name,
              { color: c.text, fontWeight: unread ? "700" : "500" },
            ]}
            numberOfLines={1}
          >
            {displayName}
          </Text>
          <Text style={[styles.time, { color: unread ? c.accent : c.muted }]}>
            {formatListTimestamp(conversation.last_date)}
          </Text>
        </View>
        <Text
          style={[
            styles.preview,
            { color: unread ? c.text : c.muted, fontWeight: unread ? "600" : "400" },
          ]}
          numberOfLines={2}
        >
          {preview}
        </Text>
        {labels.length > 0 ? (
          <View style={styles.labelsRow}>
            {labels.slice(0, 3).map((label) => (
              <View
                key={label.id}
                style={[styles.labelChip, { backgroundColor: label.color || labelColor(label.name) }]}
              >
                <Text style={styles.labelText} numberOfLines={1}>
                  {label.name}
                </Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 17 },
  body: { flex: 1, gap: 2 },
  topLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  name: { fontSize: 17, flex: 1, marginRight: 8 },
  time: { fontSize: 14 },
  preview: { fontSize: 15, lineHeight: 19 },
  labelsRow: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  labelChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    maxWidth: 120,
  },
  labelText: { color: "#fff", fontSize: 10, fontWeight: "700" },
});
