import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useFocusEffect } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { fetchSheetProspects } from "../../src/api/mailing";
import { colors } from "../../src/theme";

type Prospect = {
  id?: string | number;
  company_name?: string;
  name?: string;
  city?: string;
  status?: string;
  email?: string;
};

export default function EntreprisesScreen() {
  const { user, activated } = useAuth();
  const [rows, setRows] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSheetProspects({
        email: user?.email,
        limit: 80,
      });
      const list =
        (data.prospects as Prospect[]) ||
        (data.rows as Prospect[]) ||
        (data.items as Prospect[]) ||
        [];
      setRows(Array.isArray(list) ? list : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (activated) load();
    }, [load, activated]),
  );

  if (!activated) return <Redirect href="/(app)/recherche" />;

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>
        Liste prospects (sheet) — plan {Number(user?.plan) || 1}
      </Text>
      {error ? (
        <Pressable onPress={load} style={styles.errorBox}>
          <Text style={styles.error}>{error}</Text>
          <Text style={styles.retry}>Toucher pour réessayer</Text>
        </Pressable>
      ) : null}
      {loading && !rows.length ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(item, i) => String(item.id ?? i)}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.accent} />
          }
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <Text style={styles.empty}>Aucune entreprise pour l’instant.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.title}>
                {item.company_name || item.name || "Entreprise"}
              </Text>
              <Text style={styles.meta}>
                {[item.city, item.status, item.email].filter(Boolean).join(" · ") ||
                  "—"}
              </Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg },
  hint: {
    color: colors.muted,
    fontSize: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  title: { color: colors.text, fontWeight: "700", fontSize: 16 },
  meta: { color: colors.muted, marginTop: 4, fontSize: 13 },
  empty: { color: colors.muted, textAlign: "center", marginTop: 40 },
  errorBox: {
    margin: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,69,58,0.12)",
  },
  error: { color: colors.danger },
  retry: { color: colors.muted, marginTop: 4, fontSize: 12 },
});
