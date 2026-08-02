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
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import {
  deleteProspect,
  fetchSheetProspects,
  sendProspectMail,
  updateProspectStatus,
  type Prospect,
} from "../../src/api/mailing";
import { ApiError } from "../../src/api/http";
import { Banner, EmptyState, Segmented } from "../../src/ui/Apple";
import { ProspectDetailSheet } from "../../src/ui/ProspectDetailSheet";
import { colors } from "../../src/theme";
import {
  entreprisesHideFilterTabs,
  entreprisesHideSentTab,
  entreprisesShowContacts,
  userPlan,
} from "../../src/utils/planAccess";
import {
  isNoContactStatut,
  isSentStatut,
  prospectMatchesQuery,
  prospectStatusKind,
  prospectStatusLabel,
} from "../../src/utils/prospectStatus";

type Filter = "all" | "contact" | "sent";

export default function EntreprisesScreen() {
  const { user, activated } = useAuth();
  const router = useRouter();
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

  if (!activated) return <Redirect href="/(app)/recherche" />;

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
              router.push("/(app)/envois");
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
    <View style={styles.wrap}>
      <Text style={styles.meta}>
        {visible.length}
        {total && total !== visible.length ? ` / ${total}` : ""} entreprise
        {visible.length > 1 ? "s" : ""} · plan {userPlan(user)}
      </Text>

      <View style={styles.searchWrap}>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher"
          placeholderTextColor="rgba(235,235,245,0.35)"
          autoCorrect={false}
          autoCapitalize="none"
          clearButtonMode="while-editing"
          style={styles.search}
          returnKeyType="search"
        />
      </View>

      {!hideFilters ? (
        <View style={{ marginBottom: 8 }}>
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
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item, i) => String(item.row_index ?? item.id ?? i)}
          refreshControl={
            <RefreshControl
              refreshing={refreshing || (loading && rows.length > 0)}
              onRefresh={() => load({ background: true })}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
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
          router.push("/(app)/envois");
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
  const kind = prospectStatusKind(prospect.statut);
  const subtitleParts = [prospect.ville].filter(Boolean);
  if (showContacts) {
    const contactLine = [prospect.email, prospect.numero].filter(Boolean);
    if (contactLine.length) subtitleParts.push(contactLine.join(" · "));
  } else if (prospect.secteur) {
    subtitleParts.push(prospect.secteur);
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
    >
      <View style={styles.rowMain}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {prospect.entreprise || "Entreprise"}
        </Text>
        <Text style={styles.rowSub} numberOfLines={2}>
          {subtitleParts.join(" · ") || "—"}
        </Text>
      </View>
      <View style={styles.rowRight}>
        <View
          style={[
            styles.pill,
            kind === "sent" && styles.pillSent,
            kind === "no_contact" && styles.pillMuted,
            kind === "in_progress" && styles.pillWarn,
          ]}
        >
          <Text
            style={[
              styles.pillText,
              kind === "sent" && { color: colors.success },
              kind === "no_contact" && { color: colors.muted },
              kind === "in_progress" && { color: colors.warning },
            ]}
          >
            {prospectStatusLabel(prospect.statut)}
          </Text>
        </View>
        <Text style={styles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, paddingTop: 8 },
  meta: {
    color: colors.muted,
    fontSize: 13,
    marginHorizontal: 20,
    marginBottom: 10,
  },
  searchWrap: {
    marginHorizontal: 16,
    marginBottom: 10,
  },
  search: {
    backgroundColor: "rgba(118,118,128,0.24)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.text,
    fontSize: 17,
  },
  listContent: {
    paddingBottom: 40,
    flexGrow: 1,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginLeft: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    gap: 10,
    minHeight: 64,
  },
  rowPressed: { backgroundColor: "rgba(120,120,128,0.18)" },
  rowMain: { flex: 1, gap: 3 },
  rowTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  rowSub: { color: colors.muted, fontSize: 14, lineHeight: 18 },
  rowRight: { alignItems: "flex-end", gap: 6, flexDirection: "row" },
  pill: {
    backgroundColor: "rgba(10,132,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  pillSent: { backgroundColor: "rgba(48,209,88,0.16)" },
  pillMuted: { backgroundColor: "rgba(120,120,128,0.22)" },
  pillWarn: { backgroundColor: "rgba(255,214,10,0.16)" },
  pillText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: "700",
  },
  chevron: {
    color: "rgba(235,235,245,0.3)",
    fontSize: 22,
    marginTop: -2,
  },
});
