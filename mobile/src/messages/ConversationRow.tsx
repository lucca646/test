import { Pressable, StyleSheet, Text, View } from "react-native";
import * as Haptics from "expo-haptics";
import { useColors } from "../theme";
import type { ConversationSummary } from "./api";
import { avatarColor, formatDisplayPhone, formatListTimestamp, initials } from "./format";

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
        <View style={styles.bottomLine}>
          <Text
            style={[
              styles.preview,
              { color: unread ? c.text : c.muted, fontWeight: unread ? "600" : "400" },
            ]}
            numberOfLines={2}
          >
            {preview}
          </Text>
          {unread ? (
            <View style={[styles.badge, { backgroundColor: c.accent }]}>
              <Text style={styles.badgeText}>
                {conversation.unread_count > 9 ? "9+" : conversation.unread_count}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
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
  bottomLine: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between" },
  preview: { fontSize: 15, flex: 1, lineHeight: 19, marginRight: 8 },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    marginTop: 1,
  },
  badgeText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
