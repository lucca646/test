import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  getConversation,
  markConversationRead,
  sendMessageToContact,
  type ConversationDetail,
  type ConversationMessage,
} from "./api";
import MessageBubble from "./MessageBubble";
import { EmptyState } from "../ui/Apple";
import { useColors } from "../theme";
import { formatDaySeparator, formatDisplayPhone, shouldShowDaySeparator } from "./format";

const POLL_MS = 4000;

type Row =
  | { kind: "separator"; id: string; label: string }
  | { kind: "message"; id: string; message: ConversationMessage; isLast: boolean };

function buildRows(messages: ConversationMessage[]): Row[] {
  const rows: Row[] = [];
  messages.forEach((message, index) => {
    if (shouldShowDaySeparator(message, messages[index - 1])) {
      rows.push({
        kind: "separator",
        id: `sep-${message.index}`,
        label: formatDaySeparator(message.date),
      });
    }
    rows.push({
      kind: "message",
      id: String(message.index ?? index),
      message,
      isLast: index === messages.length - 1,
    });
  });
  return rows;
}

export default function ThreadScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Row>>(null);
  const focusedRef = useRef(false);

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!key) return;
    if (!silent) setLoading(true);
    try {
      const detail = await getConversation(key);
      setConversation(detail);
      setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, [key]);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      void load();
      markConversationRead(key).catch(() => {});
      const interval = setInterval(() => {
        if (focusedRef.current) void load(true);
      }, POLL_MS);
      return () => {
        focusedRef.current = false;
        clearInterval(interval);
      };
    }, [load, key]),
  );

  const rows = conversation ? buildRows(conversation.messages) : [];

  const onSend = async () => {
    const text = draft.trim();
    if (!text || !conversation) return;
    setSending(true);
    setDraft("");
    try {
      await sendMessageToContact({ number: conversation.phone, text, simId: conversation.sim_id });
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      await load(true);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setDraft(text);
    } finally {
      setSending(false);
    }
  };

  const title =
    conversation && conversation.name !== conversation.phone
      ? conversation.name
      : conversation
        ? formatDisplayPhone(conversation.phone)
        : "Messages";

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <Stack.Screen options={{ title, headerBackTitle: "Messages" }} />

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : !conversation ? (
        <EmptyState title="Conversation introuvable" subtitle={error || undefined} />
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          keyExtractor={(row) => row.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) =>
            item.kind === "separator" ? (
              <Text style={[styles.separator, { color: c.muted }]}>{item.label}</Text>
            ) : (
              <MessageBubble message={item.message} showStatus={item.isLast} />
            )
          }
        />
      )}

      {error && conversation ? (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      ) : null}

      <View
        style={[
          styles.composerWrap,
          { borderTopColor: c.separator, paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <TextInput
          style={[styles.composerInput, { backgroundColor: c.searchBg, color: c.text }]}
          value={draft}
          onChangeText={setDraft}
          placeholder="SMS"
          placeholderTextColor={c.muted}
          multiline
          maxLength={1200}
        />
        <Pressable
          disabled={!draft.trim() || sending}
          onPress={onSend}
          style={[
            styles.sendBtn,
            { backgroundColor: c.accent, opacity: !draft.trim() || sending ? 0.4 : 1 },
          ]}
        >
          {sending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.sendIcon}>↑</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  separator: {
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    marginVertical: 10,
  },
  errorText: { fontSize: 13, marginHorizontal: 16, marginBottom: 4 },
  composerWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    fontSize: 16,
    maxHeight: 120,
  },
  sendBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
