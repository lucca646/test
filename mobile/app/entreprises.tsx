import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Redirect,
  useFocusEffect,
  useLocalSearchParams,
  useRouter,
} from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import AuthGate from "../src/screens/AuthGate";
import {
  deleteProspect,
  fetchSheetProspects,
  sendProspectMail,
  updateProspectStatus,
  type Prospect,
} from "../src/api/mailing";
import { ApiError } from "../src/api/http";
import { Banner, EmptyState } from "../src/ui/Apple";
import { ProspectDetailSheet } from "../src/ui/ProspectDetailSheet";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";
import {
  entreprisesHideFilterTabs,
  entreprisesHideSentTab,
  entreprisesShowContacts,
  entreprisesShowMailActions,
} from "../src/utils/planAccess";
import {
  isNoContactStatut,
  isSentStatut,
  prospectMatchesQuery,
  prospectRowSecondary,
  prospectStatusKind,
  prospectStatusLabel,
} from "../src/utils/prospectStatus";

type Filter = "all" | "contact" | "sent";

function EntreprisesScreen() {
  const { user, activated } = useAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ filter?: string }>();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Prospect[]>([]);
  const [filter, setFilter] = useState<Filter>("contact");
  const [query, setQuery] = useState("");

  useEffect(() => {
    const f = params.filter;
    if (f === "contact" || f === "sent" || f === "all") setFilter(f);
  }, [params.filter]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prospect | null>(null);
  const openSwipe = useRef<Swipeable | null>(null);

  const hideFilters = entreprisesHideFilterTabs(user);
  const hideSent = entreprisesHideSentTab(user);
  const showContacts = entreprisesShowContacts(user);
  const showMail = entreprisesShowMailActions(user);

  const counts = useMemo(() => {
    const contact = rows.filter(
      (r) => !isSentStatut(r.statut) && !isNoContactStatut(r.statut),
    ).length;
    const sent = rows.filter((r) => isSentStatut(r.statut)).length;
    const all = rows.filter((r) => !isNoContactStatut(r.statut)).length;
    return { contact, sent, all };
  }, [rows]);

  const folders = useMemo(() => {
    const opts: { id: Filter; label: string; count: number }[] = [
      { id: "contact", label: "À contacter", count: counts.contact },
    ];
    if (!hideSent) {
      opts.push({ id: "sent", label: "Envoyés", count: counts.sent });
    }
    if (!hideFilters) {
      opts.push({ id: "all", label: "Tout", count: counts.all });
    }
    return opts;
  }, [counts, hideFilters, hideSent]);

  const load = useCallback(
    async ({ background = false } = {}) => {
      if (background) setRefreshing(true);
      else setLoading(true);
      setError(null);
      try {
        const data = await fetchSheetProspects({
          email: user?.email,
          limit: 300,
        });
        setRows(data.prospects);
        setSelected((prev) => {
          if (!prev?.row_index) return prev;
          return (
            data.prospects.find((r) => r.row_index === prev.row_index) || prev
          );
        });
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) {
          setError("Session expirée. Reconnectez-vous.");
          return;
        }
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?.email],
  );

  useFocusEffect(
    useCallback(() => {
      if (activated) load();
    }, [load, activated]),
  );

  const visible = useMemo(() => {
    let list = rows.filter((r) => !isNoContactStatut(r.statut));
    if (filter === "sent") {
      list = rows.filter((r) => isSentStatut(r.statut));
    } else if (filter === "contact") {
      list = rows.filter(
        (r) => !isSentStatut(r.statut) && !isNoContactStatut(r.statut),
      );
    }
    if (query.trim()) {
      list = list.filter((r) => prospectMatchesQuery(r, query));
    }
    return list;
  }, [rows, filter, query]);

  if (!activated) return <Redirect href="/recherche" />;

  const sendProspect = (p: Prospect) => {
    if (!user?.email || p.row_index == null) return;
    if (!p.mailSubject || !p.mailBody) {
      Alert.alert(
        "Mail manquant",
        "Prépare d’abord le mail dans l’onglet Envois.",
        [
          { text: "OK", style: "cancel" },
          {
            text: "Ouvrir Envois",
            onPress: () => {
              setSelected(null);
              router.push("/envois");
            },
          },
        ],
      );
      return;
    }
    Alert.alert(
      "Envoyer ?",
      `${p.entreprise || "Entreprise"}\n${p.email || ""}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          onPress: async () => {
            setBusyId(p.row_index!);
            try {
              await sendProspectMail({
                email: user.email!,
                row_index: p.row_index!,
                subject: p.mailSubject || `Candidature — ${p.entreprise || ""}`,
                body: p.mailBody || "",
                target_email: p.email,
              });
              await load({ background: true });
            } catch (e) {
              Alert.alert(
                "Envoi impossible",
                e instanceof Error ? e.message : String(e),
              );
            } finally {
              setBusyId(null);
            }
          },
        },
      ],
    );
  };

  const toggleStatus = async (p: Prospect) => {
    if (!user?.email || p.row_index == null) return;
    const sent = isSentStatut(p.statut);
    setBusyId(p.row_index);
    try {
      await updateProspectStatus({
        email: user.email,
        row_index: p.row_index,
        action: sent ? "to_contact" : "sent",
      });
      await load({ background: true });
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  const removeProspect = (p: Prospect) => {
    if (!user?.email || p.row_index == null) return;
    Alert.alert("Supprimer ?", p.entreprise || "Cette entreprise", [
      { text: "Annuler", style: "cancel" },
      {
        text: "Supprimer",
        style: "destructive",
        onPress: async () => {
          setBusyId(p.row_index!);
          try {
            await deleteProspect({
              email: user.email!,
              row_index: p.row_index!,
            });
            setSelected(null);
            await load({ background: true });
          } catch (e) {
            Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
          } finally {
            setBusyId(null);
          }
        },
      },
    ]);
  };

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: c.bg, paddingTop: Math.max(insets.top, 8) + 4 },
      ]}
    >
      <Text style={[styles.largeTitle, { color: c.text }]}>Tes entreprises</Text>
      <Text style={[styles.intro, { color: c.muted }]}>
        Celles que tu suis pour ton alternance.
      </Text>

      {!hideFilters ? (
        <View style={styles.folderRow}>
          {folders.map((f) => {
            const on = filter === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setFilter(f.id);
                }}
                style={[
                  styles.folder,
                  {
                    backgroundColor: on ? c.accent : c.searchBg,
                    minHeight: 44,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.folderLabel,
                    { color: on ? "#fff" : c.text },
                  ]}
                >
                  {f.label}
                </Text>
                <Text
                  style={[
                    styles.folderCount,
                    { color: on ? "rgba(255,255,255,0.85)" : c.muted },
                  ]}
                >
                  {f.count}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ) : null}

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Filtrer par nom, ville, email…"
          placeholderTextColor={c.muted}
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          style={[
            styles.search,
            { backgroundColor: c.searchBg, color: c.text },
          ]}
          returnKeyType="search"
        />
      </View>

      {error ? (
        <View style={{ marginBottom: 8 }}>
          <Banner
            tone="error"
            title={error}
            subtitle="Toucher pour réessayer"
            onPress={() => load()}
          />
        </View>
      ) : null}

      {loading && !rows.length ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, i) => String(item.row_index ?? item.id ?? i)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (loading && rows.length > 0)}
              onRefresh={() => load({ background: true })}
              tintColor={c.accent}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: TAB_BAR_CLEARANCE + insets.bottom },
          ]}
          ItemSeparatorComponent={() => (
            <View
              style={[styles.separator, { backgroundColor: c.separator }]}
            />
          )}
          ListEmptyComponent={
            <EmptyState
              title={
                query.trim()
                  ? "Aucun résultat"
                  : filter === "contact"
                    ? "Plus rien à contacter"
                    : "Liste vide"
              }
              subtitle={
                query.trim()
                  ? "Modifie le filtre ou la recherche."
                  : filter === "contact"
                    ? "Lance une recherche ou consulte les envoyés."
                    : "Tire pour actualiser."
              }
              actionLabel={
                !query.trim() && filter === "contact"
                  ? "Lancer une recherche"
                  : undefined
              }
              onAction={
                !query.trim() && filter === "contact"
                  ? () => router.push("/recherche")
                  : undefined
              }
            />
          }
          renderItem={({ item }) => (
            <ProspectRow
              prospect={item}
              showContacts={showContacts}
              showMail={showMail}
              busy={busyId === item.row_index}
              onOpen={() => {
                openSwipe.current?.close();
                Haptics.selectionAsync().catch(() => {});
                setSelected(item);
              }}
              onSend={() => {
                openSwipe.current?.close();
                sendProspect(item);
              }}
              onToggle={() => {
                openSwipe.current?.close();
                void toggleStatus(item);
              }}
              onSwipeOpen={(ref) => {
                if (openSwipe.current && openSwipe.current !== ref) {
                  openSwipe.current.close();
                }
                openSwipe.current = ref;
              }}
            />
          )}
        />
      )}

      <ProspectDetailSheet
        prospect={selected}
        user={user}
        busy={selected?.row_index != null && busyId === selected.row_index}
        onClose={() => setSelected(null)}
        onToggleStatus={toggleStatus}
        onSend={sendProspect}
        onDelete={removeProspect}
        onOpenEnvois={() => {
          setSelected(null);
          router.push("/envois");
        }}
      />
    </View>
  );
}

function ProspectRow({
  prospect,
  showContacts,
  showMail,
  busy,
  onOpen,
  onSend,
  onToggle,
  onSwipeOpen,
}: {
  prospect: Prospect;
  showContacts: boolean;
  showMail: boolean;
  busy: boolean;
  onOpen: () => void;
  onSend: () => void;
  onToggle: () => void;
  onSwipeOpen: (ref: Swipeable) => void;
}) {
  const c = useColors();
  const ref = useRef<Swipeable>(null);
  const kind = prospectStatusKind(prospect.statut);
  const sent = isSentStatut(prospect.statut);
  const secondary = prospectRowSecondary(prospect, showContacts);
  const statusColor =
    kind === "sent"
      ? c.success
      : kind === "in_progress"
        ? c.warning
        : c.accent;

  const renderRight = () => (
    <View style={styles.swipeActions}>
      {!sent ? (
        <Pressable
          onPress={onToggle}
          style={[styles.swipeBtn, { backgroundColor: c.success }]}
        >
          <Text style={styles.swipeBtnText}>Marquer</Text>
        </Pressable>
      ) : null}
      {showMail && !sent ? (
        <Pressable
          onPress={onSend}
          style={[styles.swipeBtn, { backgroundColor: c.accent }]}
        >
          <Text style={styles.swipeBtnText}>Envoyer</Text>
        </Pressable>
      ) : null}
    </View>
  );

  const renderLeft = () =>
    sent ? (
      <View style={styles.swipeActions}>
        <Pressable
          onPress={onToggle}
          style={[styles.swipeBtn, { backgroundColor: c.accent }]}
        >
          <Text style={styles.swipeBtnText}>À contacter</Text>
        </Pressable>
      </View>
    ) : null;

  return (
    <Swipeable
      ref={ref}
      friction={2}
      overshootRight={false}
      overshootLeft={false}
      renderRightActions={
        !sent && (showMail || true) ? renderRight : undefined
      }
      renderLeftActions={sent ? renderLeft : undefined}
      onSwipeableWillOpen={() => {
        if (ref.current) onSwipeOpen(ref.current);
      }}
    >
      <Pressable
        onPress={onOpen}
        disabled={busy}
        style={({ pressed }) => [
          styles.row,
          { backgroundColor: c.bg },
          pressed && { backgroundColor: c.rowPressed },
          busy && { opacity: 0.55 },
        ]}
      >
        <View style={styles.rowMain}>
          <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
            {prospect.entreprise || "Entreprise"}
          </Text>
          <Text style={[styles.rowSub, { color: c.muted }]} numberOfLines={1}>
            {secondary}
          </Text>
        </View>
        <View style={styles.statusTrail}>
          <View style={[styles.dot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusWord, { color: statusColor }]}>
            {prospectStatusLabel(prospect.statut)}
          </Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginBottom: 4,
  },
  intro: {
    fontSize: 15,
    lineHeight: 20,
    marginHorizontal: 20,
    marginBottom: 14,
  },
  folderRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  folder: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  folderLabel: { fontSize: 14, fontWeight: "600" },
  folderCount: { fontSize: 13, fontWeight: "600" },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  search: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    minHeight: 44,
  },
  listContent: { flexGrow: 1 },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
    minHeight: 64,
  },
  rowMain: { flex: 1, gap: 3, minWidth: 0 },
  rowTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  rowSub: { fontSize: 15, lineHeight: 20 },
  statusTrail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexShrink: 0,
    maxWidth: 110,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusWord: { fontSize: 12, fontWeight: "600" },
  swipeActions: { flexDirection: "row" },
  swipeBtn: {
    width: 88,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
  },
  swipeBtnText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
    textAlign: "center",
    paddingHorizontal: 4,
  },
});

export default function EntreprisesScreenGate() {
  return (
    <AuthGate>
      <EntreprisesScreen />
    </AuthGate>
  );
}
