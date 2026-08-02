import { useCallback, useMemo, useState } from "react";
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
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
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
import { Banner, EmptyState, Segmented } from "../src/ui/Apple";
import { ProspectDetailSheet } from "../src/ui/ProspectDetailSheet";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";
import {
  entreprisesHideFilterTabs,
  entreprisesHideSentTab,
  entreprisesShowContacts,
  userPlan,
} from "../src/utils/planAccess";
import {
  isNoContactStatut,
  isSentStatut,
  prospectMatchesQuery,
  prospectStatusKind,
  prospectStatusLabel,
} from "../src/utils/prospectStatus";

type Filter = "all" | "contact" | "sent";

function EntreprisesScreen() {
  const { user, activated } = useAuth();
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Prospect | null>(null);

  const hideFilters = entreprisesHideFilterTabs(user);
  const hideSent = entreprisesHideSentTab(user);
  const showContacts = entreprisesShowContacts(user);

  const filterOptions = useMemo(() => {
    const opts: { id: Filter; label: string }[] = [
      { id: "all", label: "Tout" },
      { id: "contact", label: "À contacter" },
    ];
    if (!hideSent) opts.push({ id: "sent", label: "Envoyés" });
    return opts;
  }, [hideSent]);

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
        setTotal(data.total);
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

  const onSend = (p: Prospect) => {
    if (!user?.email || p.row_index == null) return;
    if (!p.mailSubject || !p.mailBody) {
      Alert.alert(
        "Mail manquant",
        "Génère d’abord un mail (onglet Envois) pour cette entreprise.",
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
      "Envoyer la candidature ?",
      `${p.entreprise || "Entreprise"}\n${p.email || ""}`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Envoyer",
          style: "default",
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

  const onToggleStatus = async (p: Prospect) => {
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

  const onDelete = (p: Prospect) => {
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
      <Text style={[styles.meta, { color: c.muted }]}>
        {visible.length}
        {total && total !== visible.length ? ` / ${total}` : ""} entreprise
        {visible.length > 1 ? "s" : ""} · plan {userPlan(user)}
      </Text>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher"
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

      {!hideFilters ? (
        <View style={{ marginBottom: 10 }}>
          <Segmented
            value={filter}
            onChange={(id) => setFilter(id as Filter)}
            options={filterOptions}
          />
        </View>
      ) : null}

      {error ? (
        <View style={{ marginTop: 8, marginBottom: 4 }}>
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
              title={query.trim() ? "Aucun résultat" : "Aucune entreprise"}
              subtitle={
                query.trim()
                  ? "Modifie la recherche ou le filtre."
                  : "Lance une recherche ou tire pour actualiser."
              }
            />
          }
          renderItem={({ item }) => (
            <ProspectRow
              prospect={item}
              showContacts={showContacts}
              onPress={() => {
                Haptics.selectionAsync().catch(() => {});
                setSelected(item);
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
        onToggleStatus={onToggleStatus}
        onSend={onSend}
        onDelete={onDelete}
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
  onPress,
}: {
  prospect: Prospect;
  showContacts: boolean;
  onPress: () => void;
}) {
  const c = useColors();
  const kind = prospectStatusKind(prospect.statut);
  const subtitleParts = [prospect.ville].filter(Boolean);
  if (showContacts) {
    const contactLine = [prospect.email, prospect.numero].filter(Boolean);
    if (contactLine.length) subtitleParts.push(contactLine.join(" · "));
  } else if (prospect.secteur) {
    subtitleParts.push(prospect.secteur);
  }

  const pillBg =
    kind === "sent"
      ? c.pillSentBg
      : kind === "no_contact"
        ? c.pillMutedBg
        : kind === "in_progress"
          ? c.pillWarnBg
          : c.pillBg;
  const pillColor =
    kind === "sent"
      ? c.success
      : kind === "no_contact"
        ? c.muted
        : kind === "in_progress"
          ? c.warning
          : c.accent;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        pressed && { backgroundColor: c.rowPressed },
      ]}
    >
      <View style={styles.rowMain}>
        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
          {prospect.entreprise || "Entreprise"}
        </Text>
        <Text style={[styles.rowSub, { color: c.muted }]} numberOfLines={2}>
          {subtitleParts.join(" · ") || "—"}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View style={[styles.pill, { backgroundColor: pillBg }]}>
          <Text style={[styles.pillText, { color: pillColor }]}>
            {prospectStatusLabel(prospect.statut)}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: c.chevron }]}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  meta: {
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  search: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    minHeight: 44,
  },
  listContent: {
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    minHeight: 76,
  },
  rowMain: { flex: 1, gap: 4, minWidth: 0 },
  rowTitle: {
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  rowSub: { fontSize: 14, lineHeight: 19 },
  rowRight: {
    alignItems: "center",
    gap: 8,
    flexDirection: "row",
    flexShrink: 0,
  },
  pill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9,
    maxWidth: 118,
  },
  pillText: {
    fontSize: 12,
    fontWeight: "700",
  },
  chevron: {
    fontSize: 22,
    marginTop: -2,
  },
});


export default function EntreprisesScreenGate() {
  return (
    <AuthGate>
      <EntreprisesScreen />
    </AuthGate>
  );
}
