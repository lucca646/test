import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Stack, useFocusEffect, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  deleteDraft,
  getConversation,
  listSimDrafts,
  markConversationRead,
  proofreadText,
  resendDraft,
  sendMessageToContact,
  setBotEnabled,
  type ConversationDetail,
  type ConversationMessage,
  type SimDraft,
} from "./api";
import { threadCache } from "./cache";
import MessageBubble from "./MessageBubble";
import ContactSheetModal from "./modals/ContactSheetModal";
import TramModal from "./modals/TramModal";
import BotReportModal from "./modals/BotReportModal";
import RelaunchModal from "./modals/RelaunchModal";
import { EmptyState } from "../ui/Apple";
import { useColors } from "../theme";
import {
  formatCalRdv,
  formatCost,
  formatDaySeparator,
  formatDisplayPhone,
  shouldShowDaySeparator,
} from "./format";

const POLL_MS = 4000;
const DRAFTS_POLL_MS = 12000;

type Row =
  | { kind: "separator"; id: string; label: string }
  | { kind: "message"; id: string; message: ConversationMessage; isLast: boolean; draft?: SimDraft };

function draftToMessage(draft: SimDraft, phone: string): ConversationMessage {
  return {
    index: `draft-${draft.index}`,
    id: `draft-${draft.index}`,
    phone,
    content: draft.content,
    text: draft.content,
    date: draft.date,
    box: "sent",
    direction: "out",
    status: "non_envoye",
  };
}

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

  const [conversation, setConversation] = useState<ConversationDetail | null>(
    () => (key ? threadCache.get(key) ?? null : null),
  );
  const [loading, setLoading] = useState(() => !!key && !threadCache.has(key));
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [proofreading, setProofreading] = useState(false);
  const [drafts, setDrafts] = useState<SimDraft[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [tramModalVisible, setTramModalVisible] = useState(false);
  const [botReportModalVisible, setBotReportModalVisible] = useState(false);
  const [relaunchModalVisible, setRelaunchModalVisible] = useState(false);

  const load = useCallback(async (silent = false) => {
    if (!key) return;
    const hasCache = threadCache.has(key);
    if (!silent && !hasCache) setLoading(true);
    try {
      const detail = await getConversation(key);
      threadCache.set(key, detail);
      setConversation(detail);
      setError(null);
    } catch (e) {
      if (!silent && !hasCache) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [key]);

  const loadDrafts = useCallback(async (phone: string, simId?: string) => {
    if (!simId) return;
    try {
      const { drafts: list } = await listSimDrafts(simId);
      const key9 = phone.replace(/\D/g, "").slice(-9);
      setDrafts(list.filter((d) => d.phone.replace(/\D/g, "").slice(-9) === key9));
    } catch {
      // silencieux — brouillons secondaires
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      // Le fil s'actualise toujours (via l'intervalle ci-dessous), mais pas
      // instantanément à l'ouverture si on a déjà le cache de cette conv —
      // seulement au tout premier accès à ce fil.
      if (!key || !threadCache.has(key)) void load();
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

  useFocusEffect(
    useCallback(() => {
      if (!conversation?.phone || !conversation.sim_id) return;
      void loadDrafts(conversation.phone, conversation.sim_id);
      const interval = setInterval(() => {
        if (focusedRef.current) void loadDrafts(conversation.phone, conversation.sim_id);
      }, DRAFTS_POLL_MS);
      return () => clearInterval(interval);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [conversation?.phone, conversation?.sim_id, loadDrafts]),
  );

  const rows = useMemo(() => {
    if (!conversation) return [];
    const base = buildRows(conversation.messages);
    const draftRows: Row[] = drafts.map((d) => ({
      kind: "message",
      id: `draft-${d.index}`,
      message: draftToMessage(d, conversation.phone),
      isLast: false,
      draft: d,
    }));
    return [...base, ...draftRows];
  }, [conversation, drafts]);

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

  const onProofread = async () => {
    const text = draft.trim();
    if (!text || proofreading) return;
    setProofreading(true);
    try {
      const result = await proofreadText(text);
      if (result.changed) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
        setDraft(result.text);
      } else {
        Haptics.selectionAsync().catch(() => {});
      }
    } catch (e) {
      Alert.alert("Correction indisponible", e instanceof Error ? e.message : String(e));
    } finally {
      setProofreading(false);
    }
  };

  const onDraftPress = (item: SimDraft) => {
    if (!conversation) return;
    Alert.alert("Brouillon non envoyé", item.content, [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDraft(conversation.sim_id!, item.index);
            setDrafts((cur) => cur.filter((d) => d.index !== item.index));
          } catch (e) {
            Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
          }
        },
      },
      {
        text: "Renvoyer",
        onPress: async () => {
          try {
            await resendDraft(conversation.sim_id!, item.index);
            setDrafts((cur) => cur.filter((d) => d.index !== item.index));
            void load(true);
          } catch (e) {
            Alert.alert("Erreur d'envoi", e instanceof Error ? e.message : String(e));
          }
        },
      },
    ]);
  };

  const title =
    conversation && conversation.name !== conversation.phone
      ? conversation.name
      : conversation
        ? formatDisplayPhone(conversation.phone)
        : "Messages";

  const onToggleBot = async (next: boolean) => {
    if (!conversation) return;
    Haptics.selectionAsync().catch(() => {});
    const optimistic = { ...conversation, bot_enabled: next };
    setConversation(optimistic);
    if (key) threadCache.set(key, optimistic);
    try {
      await setBotEnabled(conversation.phone, next, conversation.sim_id);
    } catch {
      const reverted = { ...conversation, bot_enabled: !next };
      setConversation(reverted);
      if (key) threadCache.set(key, reverted);
    }
  };

  const openMenu = () => {
    if (!conversation) return;
    Haptics.selectionAsync().catch(() => {});
    const options = ["Fiche contact", "Avancement trame", "Relancer", "Signaler le bot", "Annuler"];
    ActionSheetIOS.showActionSheetWithOptions(
      { options, cancelButtonIndex: options.length - 1 },
      (index) => {
        if (index === 0) setContactModalVisible(true);
        else if (index === 1) setTramModalVisible(true);
        else if (index === 2) setRelaunchModalVisible(true);
        else if (index === 3) setBotReportModalVisible(true);
      },
    );
  };

  const botEnabled = conversation?.bot_enabled ?? true;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? insets.top : 0}
    >
      <Stack.Screen
        options={{
          title,
          headerBackTitle: "Messages",
          headerRight: conversation
            ? () => (
                <View style={styles.headerActions}>
                  <Text style={styles.botEmoji}>🤖</Text>
                  <Switch
                    value={botEnabled}
                    onValueChange={onToggleBot}
                    trackColor={{ false: c.warning, true: c.success }}
                    thumbColor="#fff"
                    ios_backgroundColor={c.warning}
                    style={styles.botSwitch}
                  />
                  <Pressable onPress={openMenu} hitSlop={8} style={styles.menuBtn}>
                    <Text style={[styles.menuIcon, { color: c.accent }]}>•••</Text>
                  </Pressable>
                </View>
              )
            : undefined,
        }}
      />

      {conversation ? (
        <>
          <ContactSheetModal
            visible={contactModalVisible}
            conversation={conversation}
            onClose={() => setContactModalVisible(false)}
            onSaved={(patch) => {
              const updated = { ...conversation, ...patch };
              setConversation(updated);
              if (key) threadCache.set(key, updated);
            }}
            onDeleted={() => {
              setContactModalVisible(false);
              setConversation(null);
              if (key) threadCache.delete(key);
            }}
          />
          <TramModal
            visible={tramModalVisible}
            number={conversation.phone}
            onClose={() => setTramModalVisible(false)}
          />
          <BotReportModal
            visible={botReportModalVisible}
            number={conversation.phone}
            simId={conversation.sim_id}
            onClose={() => setBotReportModalVisible(false)}
          />
          <RelaunchModal
            visible={relaunchModalVisible}
            number={conversation.phone}
            contactName={conversation.name}
            simId={conversation.sim_id}
            onClose={() => setRelaunchModalVisible(false)}
            onSent={() => load(true)}
          />
        </>
      ) : null}

      {!loading && conversation && !botEnabled ? (
        <View style={[styles.botBanner, { backgroundColor: c.pillWarnBg }]}>
          <Text style={[styles.botBannerText, { color: c.pillWarnText }]}>
            Bot désactivé — réponse manuelle active
          </Text>
        </View>
      ) : null}

      {!loading && conversation?.cal_rdv_at ? (
        <View style={[styles.rdvBanner, { backgroundColor: "#fff4e0" }]}>
          <Text style={[styles.rdvBannerText, { color: "#c93400" }]}>
            📅 RDV Cal.com · {formatCalRdv(conversation.cal_rdv_at)}
          </Text>
        </View>
      ) : null}

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
            ) : item.draft ? (
              <Pressable onPress={() => onDraftPress(item.draft!)}>
                <MessageBubble message={item.message} showStatus />
              </Pressable>
            ) : (
              <MessageBubble message={item.message} showStatus={item.isLast} />
            )
          }
        />
      )}

      {error && conversation ? (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      ) : null}

      {conversation?.total_cost ? (
        <Text style={[styles.totalCost, { color: c.muted }]}>
          Coût total : {formatCost(conversation.total_cost)}
        </Text>
      ) : null}

      <View
        style={[
          styles.composerWrap,
          { borderTopColor: c.separator, paddingBottom: Math.max(insets.bottom, 8) },
        ]}
      >
        <Pressable
          disabled={!draft.trim() || proofreading}
          onPress={onProofread}
          style={[styles.aaBtn, { opacity: !draft.trim() || proofreading ? 0.35 : 1 }]}
        >
          {proofreading ? (
            <ActivityIndicator size="small" color={c.accent} />
          ) : (
            <Text style={[styles.aaText, { color: c.accent }]}>Aa</Text>
          )}
        </Pressable>
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
  headerActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  botEmoji: { fontSize: 15 },
  botSwitch: { transform: [{ scale: 0.78 }] },
  menuBtn: { paddingHorizontal: 4, paddingVertical: 4, marginLeft: 2 },
  menuIcon: { fontSize: 18, fontWeight: "800" },
  botBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  botBannerText: { fontSize: 13, fontWeight: "600", textAlign: "center" },
  rdvBanner: {
    marginHorizontal: 12,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  rdvBannerText: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  totalCost: { fontSize: 11, textAlign: "center", marginBottom: 4 },
  composerWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  aaBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  aaText: { fontSize: 15, fontWeight: "800" },
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
