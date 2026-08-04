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
import { listConversations, listSims, type ConversationSummary, type SimStatus } from "./api";
import { conversationsCache, conversationsCacheKey } from "./cache";
import ConversationRow from "./ConversationRow";
import { EmptyState, Segmented } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";
import { formatDisplayPhone } from "./format";

const POLL_MS = 8000;
const ALL_SIM = "all";

export default function ConversationsListScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [simFilter, setSimFilter] = useState<string>(ALL_SIM);
  const [conversations, setConversations] = useState<ConversationSummary[]>(
    () => conversationsCache.get(conversationsCacheKey(ALL_SIM)) ?? [],
  );
  const [sims, setSims] = useState<SimStatus[]>([]);
  // Pas de spinner plein écran si on a déjà des données en cache pour ce filtre
  // (stale-while-revalidate) — seulement au tout premier chargement à froid.
  const [loading, setLoading] = useState(() => !conversationsCache.has(conversationsCacheKey(ALL_SIM)));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const focusedRef = useRef(false);

  const load = useCallback(async (silent = false, sim = simFilter) => {
    const cacheKey = conversationsCacheKey(sim);
    const hasCache = conversationsCache.has(cacheKey);
    if (!silent && !hasCache) setLoading(true);
    try {
      const data = await listConversations(sim === ALL_SIM ? undefined : sim);
      conversationsCache.set(cacheKey, data);
      setConversations(data);
      setError(null);
    } catch (e) {
      if (!silent && !hasCache) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [simFilter]);

  useFocusEffect(
    useCallback(() => {
      void listSims().then(setSims).catch(() => {});
    }, []),
  );

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

  const onChangeSim = (id: string) => {
    setSimFilter(id);
    setConversations(conversationsCache.get(conversationsCacheKey(id)) ?? []);
    void load(false, id);
  };

  const simOptions = [
    { id: ALL_SIM, label: "Toutes" },
    ...sims.map((s) => ({ id: s.id, label: s.label.replace(/^SIM\s*/i, "SIM ") })),
  ];

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

      {sims.length > 1 ? (
        <View style={styles.simFilterWrap}>
          <Segmented options={simOptions} value={simFilter} onChange={onChangeSim} />
        </View>
      ) : null}

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
              onPress={() => router.push(`/thread/${item.key}`)}
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
  simFilterWrap: { marginBottom: 8 },
  errorText: { marginHorizontal: 16, marginBottom: 6, fontSize: 13 },
});
