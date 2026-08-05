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
import { CONVERSATIONS_CACHE_KEY, conversationsCache } from "./cache";
import ConversationRow from "./ConversationRow";
import NewContactModal from "./modals/NewContactModal";
import { EmptyState } from "../ui/Apple";
import { GlassSurface } from "../ui/Glass";
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
  // Multi-sélection : on peut cumuler plusieurs catégories/étiquettes.
  const [labelFilters, setLabelFilters] = useState<string[]>([]);
  // Une seule liste en mémoire : tous SIM confondus. Le filtre SIM est ensuite
  // 100% côté client (par `sim_id`) — aucun appel réseau au changement d'onglet,
  // et le dernier snapshot connu reste affiché même hors connexion.
  const [allConversations, setAllConversations] = useState<ConversationSummary[]>(
    () => conversationsCache.get(CONVERSATIONS_CACHE_KEY) ?? [],
  );
  const [sims, setSims] = useState<SimStatus[]>([]);
  // Pas de spinner plein écran si on a déjà des données en cache
  // (stale-while-revalidate) — seulement au tout premier chargement à froid.
  const [loading, setLoading] = useState(() => !conversationsCache.has(CONVERSATIONS_CACHE_KEY));
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [newContactVisible, setNewContactVisible] = useState(false);
  const focusedRef = useRef(false);

  const load = useCallback(async (silent = false) => {
    const hasCache = conversationsCache.has(CONVERSATIONS_CACHE_KEY);
    if (!silent && !hasCache) setLoading(true);
    try {
      const data = await listConversations();
      conversationsCache.set(CONVERSATIONS_CACHE_KEY, data);
      setAllConversations(data);
      setError(null);
    } catch (e) {
      // Hors connexion ou erreur réseau : on garde le dernier snapshot affiché,
      // on ne vide jamais la liste (le bandeau hors-ligne global signale déjà l'état).
      if (!silent && !hasCache) setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void listSims().then(setSims).catch(() => {});
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      focusedRef.current = true;
      // Toujours réactualiser en tâche de fond (l'intervalle ci-dessous s'en
      // charge) — mais pas dès l'ouverture de l'écran si on a déjà des
      // données en cache : on évite ainsi une requête réseau à chaque simple
      // retour sur l'onglet Messages. Sans cache (tout premier lancement),
      // on charge immédiatement pour ne pas laisser l'écran vide.
      if (!conversationsCache.has(CONVERSATIONS_CACHE_KEY)) void load();
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
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load(true);
    setRefreshing(false);
  };

  // Sous-ensemble du SIM sélectionné — dérivé en mémoire, jamais re-fetché.
  const bySim = useMemo(() => {
    if (simFilter === ALL_SIM) return allConversations;
    return allConversations.filter((conv) => conv.sim_id === simFilter);
  }, [allConversations, simFilter]);

  const availableLabels = useMemo(() => {
    const byName = new Map<string, string | undefined>();
    for (const conv of bySim) {
      for (const label of conv.labels || []) {
        if (!byName.has(label.name)) byName.set(label.name, label.color);
      }
    }
    return [...byName.entries()].map(([name, color]) => ({ name, color }));
  }, [bySim]);

  const toggleLabelFilter = (name: string) => {
    Haptics.selectionAsync().catch(() => {});
    setLabelFilters((cur) => (cur.includes(name) ? cur.filter((n) => n !== name) : [...cur, name]));
  };

  const filtered = useMemo(() => {
    let list = bySim;
    if (unreadOnly) list = list.filter((conv) => conv.unread_count > 0);
    if (labelFilters.length > 0) {
      list = list.filter((conv) => (conv.labels || []).some((l) => labelFilters.includes(l.name)));
    }
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
  }, [bySim, unreadOnly, labelFilters, query]);

  const unreadTotal = bySim.filter((conv) => conv.unread_count > 0).length;
  const hasActiveFilters = unreadOnly || labelFilters.length > 0;

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
              active={labelFilters.includes(label.name)}
              onPress={() => toggleLabelFilter(label.name)}
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
  const content = (
    <>
      {connected !== undefined ? (
        <View
          style={[
            styles.simDot,
            { backgroundColor: connected ? c.success : c.muted },
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
    </>
  );
  return (
    <Pressable onPress={onPress}>
      {active ? (
        <View style={[styles.simChip, { backgroundColor: c.accent, borderColor: c.accent }]}>
          {content}
        </View>
      ) : (
        <GlassSurface radius={16} style={[styles.simChip, { borderColor: "transparent" }]}>
          {content}
        </GlassSurface>
      )}
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
  const text = (
    <Text style={[styles.filterChipText, { color: active ? "#fff" : c.text }]} numberOfLines={1}>
      {label}
    </Text>
  );
  return (
    <Pressable onPress={onPress}>
      {active ? (
        <View style={[styles.filterChip, { backgroundColor: tint, borderColor: tint }]}>{text}</View>
      ) : (
        <GlassSurface radius={15} style={[styles.filterChip, { borderColor: "transparent" }]}>
          {text}
        </GlassSurface>
      )}
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
