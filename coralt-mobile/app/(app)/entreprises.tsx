import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
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
import {
  Banner,
  Button,
  EmptyState,
  Segmented,
} from "../../src/ui/Apple";
import { colors } from "../../src/theme";
import { userPlan } from "../../src/utils/planAccess";

type Filter = "all" | "contact" | "sent";

function statusLabel(s?: string) {
  const v = (s || "").toLowerCase();
  if (v === "sent" || v === "send" || v.includes("envoy")) return "Envoyé";
  if (v === "no_contact") return "Ne pas contacter";
  return "À contacter";
}

export default function EntreprisesScreen() {
  const { user, activated, logout } = useAuth();
  const router = useRouter();
  const [rows, setRows] = useState<Prospect[]>([]);
  const [total, setTotal] = useState(0);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSheetProspects({
        email: user?.email,
        limit: 300,
      });
      setRows(data.prospects);
      setTotal(data.total);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Session expirée. Reconnectez-vous.");
        await logout();
        router.replace("/(auth)/login");
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user?.email, logout, router]);

  useFocusEffect(
    useCallback(() => {
      if (activated) load();
    }, [load, activated]),
  );

  const visible = useMemo(() => {
    if (filter === "all") return rows;
    if (filter === "sent") {
      return rows.filter((r) =>
        /sent|send|envoy/i.test(String(r.statut || "")),
      );
    }
    return rows.filter(
      (r) => !/sent|send|envoy|no_contact/i.test(String(r.statut || "")),
    );
  }, [rows, filter]);

  if (!activated) return <Redirect href="/(app)/recherche" />;

  const onSend = (p: Prospect) => {
    if (!user?.email || p.row_index == null) return;
    if (!p.mailSubject || !p.mailBody) {
      Alert.alert(
        "Mail manquant",
        "Génère d’abord un mail (onglet Envois) pour cette entreprise.",
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
              await load();
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
    const sent = /sent|send|envoy/i.test(String(p.statut || ""));
    setBusyId(p.row_index);
    try {
      await updateProspectStatus({
        email: user.email,
        row_index: p.row_index,
        action: sent ? "to_contact" : "sent",
      });
      await load();
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
            await load();
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
        {total} prospect{total > 1 ? "s" : ""} · plan {userPlan(user)}
      </Text>

      <Segmented
        value={filter}
        onChange={(id) => setFilter(id as Filter)}
        options={[
          { id: "all", label: "Tout" },
          { id: "contact", label: "À contacter" },
          { id: "sent", label: "Envoyés" },
        ]}
      />

      {error ? (
        <View style={{ marginTop: 12 }}>
          <Banner
            tone="error"
            title={error}
            subtitle="Toucher pour réessayer"
            onPress={load}
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
              refreshing={loading}
              onRefresh={load}
              tintColor={colors.accent}
            />
          }
          contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
          ListEmptyComponent={
            <EmptyState
              title="Aucune entreprise"
              subtitle="Lance une recherche ou tire pour actualiser."
            />
          }
          renderItem={({ item }) => {
            const busy = busyId === item.row_index;
            return (
              <View style={styles.card}>
                <View style={styles.cardTop}>
                  <Text style={styles.title} numberOfLines={2}>
                    {item.entreprise || "Entreprise"}
                  </Text>
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {statusLabel(item.statut)}
                    </Text>
                  </View>
                </View>
                <Text style={styles.line}>
                  {[item.ville, item.secteur, item.taille]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </Text>
                <Text style={styles.line}>
                  {[item.email, item.numero, item.contact]
                    .filter(Boolean)
                    .join(" · ") || "Pas de contact"}
                </Text>

                <View style={styles.actions}>
                  {item.lien ? (
                    <Pressable
                      onPress={() => Linking.openURL(String(item.lien))}
                      style={styles.linkBtn}
                    >
                      <Text style={styles.linkText}>Site</Text>
                    </Pressable>
                  ) : null}
                  <View style={{ flex: 1 }} />
                </View>

                <View style={styles.btnRow}>
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Statut"
                      variant="gray"
                      disabled={busy}
                      onPress={() => onToggleStatus(item)}
                    />
                  </View>
                  {userPlan(user) >= 3 ? (
                    <View style={{ flex: 1 }}>
                      <Button
                        label="Envoyer"
                        loading={busy}
                        onPress={() => onSend(item)}
                      />
                    </View>
                  ) : null}
                  <View style={{ flex: 1 }}>
                    <Button
                      label="Suppr."
                      variant="destructive"
                      disabled={busy}
                      onPress={() => onDelete(item)}
                    />
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}
    </View>
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
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  title: {
    flex: 1,
    color: colors.text,
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  badge: {
    backgroundColor: "rgba(10,132,255,0.18)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: { color: colors.accent, fontSize: 11, fontWeight: "700" },
  line: { color: colors.muted, fontSize: 14, lineHeight: 19 },
  actions: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  linkBtn: { paddingVertical: 4 },
  linkText: { color: colors.accent, fontWeight: "600", fontSize: 15 },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 6 },
});
