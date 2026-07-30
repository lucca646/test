import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useFocusEffect } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import {
  fetchSheetProspects,
  sendProspectMail,
  updateProspectStatus,
} from "../../src/api/mailing";
import { hasEnvoisAccess } from "../../src/utils/planAccess";
import { colors } from "../../src/theme";

type Prospect = {
  id?: string | number;
  company_name?: string;
  name?: string;
  email?: string;
  city?: string;
};

export default function EnvoisScreen() {
  const { user, activated } = useAuth();
  const [deck, setDeck] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const canSwipe = activated && hasEnvoisAccess(user);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSheetProspects({
        email: user?.email,
        for_swipe: true,
        limit: 30,
      });
      const list =
        (data.prospects as Prospect[]) ||
        (data.rows as Prospect[]) ||
        [];
      setDeck(Array.isArray(list) ? list : []);
      setStatus(null);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (canSwipe) load();
    }, [load, canSwipe]),
  );

  if (!activated) return <Redirect href="/(app)/recherche" />;
  if (!hasEnvoisAccess(user)) {
    return (
      <View style={styles.wrap}>
        <Text style={styles.title}>Envois (plan 3)</Text>
        <Text style={styles.meta}>
          Ton plan actuel ({Number(user?.plan) || 1}) ne débloque pas le swipe.
        </Text>
      </View>
    );
  }

  const current = deck[0];

  const skip = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await updateProspectStatus({
        email: user?.email,
        id: current.id,
        status: "skip",
      });
      setDeck((d) => d.slice(1));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const send = async () => {
    if (!current) return;
    setBusy(true);
    try {
      await sendProspectMail({
        email: user?.email,
        id: current.id,
      });
      setDeck((d) => d.slice(1));
      setStatus("Candidature envoyée.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.wrap}>
      <Text style={styles.hint}>{deck.length} carte(s) restantes</Text>
      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : current ? (
        <View style={styles.card}>
          <Text style={styles.title}>
            {current.company_name || current.name || "Entreprise"}
          </Text>
          <Text style={styles.meta}>
            {[current.city, current.email].filter(Boolean).join(" · ") || "—"}
          </Text>
          <View style={styles.actions}>
            <Pressable
              style={[styles.btn, styles.skip]}
              onPress={skip}
              disabled={busy}
            >
              <Text style={styles.btnText}>Passer</Text>
            </Pressable>
            <Pressable
              style={[styles.btn, styles.send]}
              onPress={send}
              disabled={busy}
            >
              <Text style={styles.btnText}>Envoyer</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={styles.meta}>File vide — reviens plus tard.</Text>
      )}
      {status ? <Text style={styles.status}>{status}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colors.bg, padding: 16, gap: 12 },
  hint: { color: colors.muted, fontSize: 12 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 20,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    minHeight: 220,
    justifyContent: "space-between",
    gap: 16,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  actions: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  skip: { backgroundColor: "rgba(255,255,255,0.1)" },
  send: { backgroundColor: colors.accent },
  btnText: { color: "#fff", fontWeight: "700" },
  status: { color: colors.muted, fontSize: 13 },
});
