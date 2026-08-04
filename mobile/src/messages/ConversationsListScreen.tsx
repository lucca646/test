import { useCallback, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { listConversations, listSims, type ConversationSummary, type SimStatus } from "./api";
import { conversationsCache, conversationsCacheKey } from "./cache";
import ConversationRow from "./ConversationRow";
import NewContactModal from "./modals/NewContactModal";
import { EmptyState } from "../ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../theme";
import { formatDisplayPhone, labelColor } from "./format";

const POLL_MS = 8000;
const ALL_SIM = "all";

export default function ConversationsListScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [simFilter, setSimFilter] = useState<string>(ALL_SIM);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [labelFilter, setLabelFilter] = useState<string | null>(null);
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
  const [newContactVisible, setNewContactVisible] = useState(false);
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
    Haptics.selectionAsync().catch(() => {});
    setSimFilter(id);
    setConversations(conversationsCache.get(conversationsCacheKey(id)) ?? []);
    void load(false, id);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  const availableLabels = useMemo(() => {
    const byName = new Map<string, string | undefined>();
    for (const conv of conversations) {
      for (const label of conv.labels || []) {
        if (!byName.has(label.name)) byName.set(label.name, label.color);
      }
    }
    return [...byName.entries()].map(([name, color]) => ({ name, color }));
  }, [conversations]);

  const filtered = useMemo(() => {
    let list = conversations;
    if (unreadOnly) list = list.filter((conv) => conv.unread_count > 0);
    if (labelFilter) list = list.filter((conv) => (conv.labels || []).some((l) => l.name === labelFilter));
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (conv) =>
          conv.name?.toLowerCase().includes(q) ||
          conv.phone?.includes(q) ||
          formatDisplayPhone(conv.phone).toLowerCase().includes(q),
      );
    }
    return list;
  }, [conversations, unreadOnly, labelFilter, query]);

  const unreadTotal = conversations.filter((conv) => conv.unread_count > 0).length;
  const hasActiveFilters = unreadOnly || !!labelFilter;

  return (
    <View style={[styles.wrap, { backgroundColor: c.bg, paddingTop: Math.max(insets.top, 8) + 4 }]}>
      <View style={styles.titleRow}>
        <Text style={[styles.largeTitle, { color: c.text }]}>Messages</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            setNewContactVisible(true);
          }}
          hitSlop={10}
          style={styles.newBtn}
        >
          <Text style={[styles.newBtnIcon, { color: c.accent }]}>✎</Text>
        </Pressable>
      </View>

      <NewContactModal
        visible={newContactVisible}
        simId={simFilter}
        onClose={() => setNewContactVisible(false)}
      />

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
        <View style={styles.simRowWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRowContent}
          >
            <SimChip
              label="Toutes"
              active={simFilter === ALL_SIM}
              onPress={() => onChangeSim(ALL_SIM)}
            />
            {sims.map((s) => (
              <SimChip
                key={s.id}
                label={s.label.replace(/^SIM\s*/i, "SIM ")}
                active={simFilter === s.id}
                connected={s.connected}
                draftCount={s.draftCount}
                onPress={() => onChangeSim(s.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.filterRowWrap}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRowContent}
        >
          <FilterChip
            label={unreadTotal > 0 ? `Non lus (${unreadTotal})` : "Non lus"}
            active={unreadOnly}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setUnreadOnly((v) => !v);
            }}
          />
          {availableLabels.map((label) => (
            <FilterChip
              key={label.name}
              label={label.name}
              color={label.color || labelColor(label.name)}
              active={labelFilter === label.name}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setLabelFilter((cur) => (cur === label.name ? null : label.name));
              }}
            />
          ))}
        </ScrollView>
      </View>

      {error ? (
        <Text style={[styles.errorText, { color: c.danger }]}>{error}</Text>
      ) : null}

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
      ) : filtered.length === 0 ? (
        <EmptyState
          title={query || hasActiveFilters ? "Aucun résultat" : "Aucune conversation"}
          subtitle={query || hasActiveFilters ? undefined : "Les SMS reçus apparaîtront ici."}
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

function SimChip({
  label,
  active,
  connected,
  draftCount,
  onPress,
}: {
  label: string;
  active: boolean;
  connected?: boolean;
  draftCount?: number;
  onPress: () => void;
}) {
  const c = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.simChip,
        {
          backgroundColor: active ? c.accent : c.searchBg,
          borderColor: active ? c.accent : "transparent",
        },
      ]}
    >
      {connected !== undefined ? (
        <View
          style={[
            styles.simDot,
            { backgroundColor: connected ? "#34c759" : "#8e8e93" },
          ]}
        />
      ) : null}
      <Text style={[styles.simChipText, { color: active ? "#fff" : c.text }]}>{label}</Text>
      {draftCount ? (
        <View style={[styles.simBadge, { backgroundColor: active ? "#fff" : c.danger }]}>
          <Text style={[styles.simBadgeText, { color: active ? c.accent : "#fff" }]}>
            {draftCount}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function FilterChip({
  label,
  color,
  active,
  onPress,
}: {
  label: string;
  color?: string;
  active: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const tint = color || c.accent;
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? tint : c.searchBg,
          borderColor: active ? tint : "transparent",
        },
      ]}
    >
      <Text style={[styles.filterChipText, { color: active ? "#fff" : c.text }]} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 16,
    marginBottom: 8,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  newBtn: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  newBtnIcon: { fontSize: 22 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 36,
  },
  searchInput: { flex: 1, fontSize: 16, height: 36 },
  simRowWrap: { height: 32, marginBottom: 10 },
  filterRowWrap: { height: 30, marginBottom: 10 },
  chipRowContent: { paddingHorizontal: 16, gap: 8, alignItems: "center" },
  simChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
  },
  simDot: { width: 6, height: 6, borderRadius: 3 },
  simChipText: { fontSize: 13, fontWeight: "600" },
  simBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  simBadgeText: { fontSize: 10, fontWeight: "800" },
  filterChip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipText: { fontSize: 12, fontWeight: "600" },
  errorText: { marginHorizontal: 16, marginBottom: 6, fontSize: 13 },
});
