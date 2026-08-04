import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listConversations, type ConversationSummary } from "./api";
import ConversationRow from "./ConversationRow";
import { EmptyState } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";
import { formatDisplayPhone } from "./format";

const POLL_MS = 8000;

export default function ConversationsListScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const focusedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const data = await listConversations();
      setConversations(data);
      setError(null);
    } catch (e) {
      if (!silent) setError(e instanceof Error ? e.message : String(e));
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      void load();
      const interval = setInterval(() => {
        if (focusedRef.current) void load(true);
      }, POLL_MS);
      return () => {
        focusedRef.current = false;
        clearInterval(interval);
      };
    }, [load]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const filtered = query.trim()
    ? conversations.filter((conv) => {
        const q = query.trim().toLowerCase();
        return (
          conv.name?.toLowerCase().includes(q) ||
          conv.phone?.includes(q) ||
          formatDisplayPhone(conv.phone).toLowerCase().includes(q)
        );
      })
    : conversations;

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, paddingTop: Math.max(insets.top, 8) + 4 }]}>
      <Text style={[styles.largeTitle, { color: c.text }]}>Messages</Text>

      <View style={[styles.searchWrap, { backgroundColor: c.searchBg }]}>
        <Text style={{ color: c.muted, fontSize: 15 }}>🔍</Text>
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher"
          placeholderTextColor={c.muted}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query ? "Aucun résultat" : "Aucune conversation"}
          subtitle={query ? undefined : "Les SMS reçus apparaîtront ici."}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingBottom: TAB_BAR_CLEARANCE + insets.bottom }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.accent} />
          }
          renderItem={({ item }) => (
            <ConversationRow
              conversation={item}
              onPress={() => router.push(`/messages/${item.key}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  largeTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: { flex: 1, fontSize: 16, height: 36 },
  errorText: { marginHorizontal: 16, marginBottom: 6, fontSize: 13 },
});
