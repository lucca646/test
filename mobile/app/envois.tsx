import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Redirect, useFocusEffect } from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import AuthGate from "../src/screens/AuthGate";
import {
  fetchSheetProspects,
  regenerateMail,
  sendProspectMail,
  updateProspectStatus,
  type Prospect,
} from "../src/api/mailing";
import { ApiError } from "../src/api/http";
import { Banner, Button, EmptyState } from "../src/ui/Apple";
import SwipeDeck from "../src/ui/SwipeDeck";
import { hasEnvoisAccess } from "../src/utils/planAccess";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";

const PAGE_SIZE = 10;
/** Quand il reste ≤ N cartes, précharge la page suivante. */
const PREFETCH_AT = 4;

function prospectKey(p: Prospect) {
  return String(p.row_index ?? p.id ?? "");
}

function EnvoisScreen() {
  const { user, activated } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [deck, setDeck] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [busy, setBusy] = useState<"send" | "skip" | "regen" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const offsetRef = useRef(0);
  const hasMoreRef = useRef(true);
  const fetchingMoreRef = useRef(false);

  const canSwipe = activated && hasEnvoisAccess(user);

  const mergeUnique = (prev: Prospect[], next: Prospect[]) => {
    const seen = new Set(prev.map(prospectKey).filter(Boolean));
    const added = next.filter((p) => {
      const k = prospectKey(p);
      if (!k || seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    return [...prev, ...added];
  };

  const loadInitial = useCallback(async () => {
    setLoading(true);
    setError(null);
    offsetRef.current = 0;
    hasMoreRef.current = true;
    try {
      const data = await fetchSheetProspects({
        email: user?.email,
        for_swipe: true,
        limit: PAGE_SIZE,
        offset: 0,
      });
      setDeck(data.prospects);
      setTotal(data.total);
      offsetRef.current = data.nextOffset;
      hasMoreRef.current = data.has_more;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        setError("Session expirée. Reconnectez-vous.");
      } else {
        setError(e instanceof Error ? e.message : String(e));
      }
    } finally {
      setLoading(false);
    }
  }, [user?.email]);

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || fetchingMoreRef.current) return;
    fetchingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const data = await fetchSheetProspects({
        email: user?.email,
        for_swipe: true,
        limit: PAGE_SIZE,
        offset: offsetRef.current,
      });
      setDeck((prev) => mergeUnique(prev, data.prospects));
      setTotal(data.total);
      offsetRef.current = data.nextOffset;
      hasMoreRef.current = data.has_more;
    } catch {
      /* ignore prefetch errors */
    } finally {
      fetchingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (canSwipe) loadInitial();
    }, [canSwipe, loadInitial]),
  );

  useEffect(() => {
    if (!canSwipe || loading) return;
    if (deck.length > 0 && deck.length <= PREFETCH_AT && hasMoreRef.current) {
      void loadMore();
    }
  }, [deck.length, canSwipe, loading, loadMore]);

  if (!activated) return <Redirect href="/recherche" />;
  if (!hasEnvoisAccess(user)) {
    return (
      <View
        style={[
          styles.wrap,
          { backgroundColor: c.bg, paddingTop: Math.max(insets.top, 8) + 4 },
        ]}
      >
        <EmptyState
          title="Envois réservés au plan 3"
          subtitle="Passe au plan Complet pour swiper et envoyer."
        />
      </View>
    );
  }

  const current = deck[0];

  const send = async (p: Prospect) => {
    if (!p.row_index || !user?.email) return;
    setBusy("send");
    try {
      await sendProspectMail({
        email: user.email,
        row_index: p.row_index,
        subject: p.mailSubject || `Candidature — ${p.entreprise || ""}`,
        body: p.mailBody || "",
        target_email: p.email,
      });
      setDeck((d) => d.slice(1));
    } catch (e) {
      Alert.alert("Envoi", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const skip = async (p: Prospect) => {
    if (!p.row_index || !user?.email) return;
    setBusy("skip");
    try {
      await updateProspectStatus({
        email: user.email,
        row_index: p.row_index,
        action: "no_contact",
      });
      setDeck((d) => d.slice(1));
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const regen = async () => {
    if (!current?.row_index || !user?.email) return;
    setBusy("regen");
    try {
      const data = await regenerateMail({
        email: user.email,
        row_index: current.row_index,
      });
      setDeck((d) => {
        const next = [...d];
        next[0] = {
          ...next[0],
          mailSubject:
            (data.mailSubject as string) ||
            (data.subject as string) ||
            next[0].mailSubject,
          mailBody:
            (data.mailBody as string) ||
            (data.body as string) ||
            next[0].mailBody,
        };
        return next;
      });
    } catch (e) {
      Alert.alert("Régénération", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: c.bg,
          paddingTop: Math.max(insets.top, 8) + 4,
          paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
        },
      ]}
    >
      <Text style={[styles.largeTitle, { color: c.text }]}>Envois</Text>
      <View style={styles.metaRow}>
        <Text style={[styles.meta, { color: c.muted }]}>
          {deck.length}
          {total > deck.length ? ` / ${total}` : ""} carte
          {deck.length > 1 ? "s" : ""}
        </Text>
        {loadingMore ? (
          <Text style={[styles.metaHint, { color: c.accent }]}>
            Chargement…
          </Text>
        ) : null}
      </View>

      {error ? (
        <Banner
          tone="error"
          title={error}
          subtitle="Toucher pour réessayer"
          onPress={loadInitial}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={c.accent} style={{ marginTop: 48 }} />
      ) : current ? (
        <>
          <SwipeDeck
            prospects={deck}
            disabled={!!busy}
            onSend={send}
            onSkip={skip}
          />
          <View style={styles.actions}>
            <View style={[styles.actionBtn, { flex: 0.9 }]}>
              <Button
                label="Passer"
                variant="gray"
                loading={busy === "skip"}
                disabled={!!busy}
                onPress={() => skip(current)}
              />
            </View>
            <View style={[styles.actionBtn, { flex: 0.75 }]}>
              <Button
                label="Regen"
                variant="tinted"
                size="sm"
                loading={busy === "regen"}
                disabled={!!busy}
                onPress={regen}
              />
            </View>
            <View style={[styles.actionBtn, { flex: 1.15 }]}>
              <Button
                label="Envoyer"
                loading={busy === "send"}
                disabled={!!busy}
                onPress={() => send(current)}
              />
            </View>
          </View>
          {!busy ? (
            <Text style={[styles.hint, { color: c.muted }]}>
              Glisse à droite pour envoyer · à gauche pour passer
            </Text>
          ) : (
            <View style={{ height: 14 }} />
          )}
        </>
      ) : (
        <EmptyState
          title="File vide"
          subtitle={
            hasMoreRef.current
              ? "Chargement de la suite…"
              : "Plus de candidatures prêtes. Reviens après une recherche."
          }
        />
      )}
    </View>
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
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 4,
    minHeight: 22,
  },
  meta: { fontSize: 13 },
  metaHint: { fontSize: 12, fontWeight: "600" },
  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 4,
    alignItems: "center",
  },
  actionBtn: { minHeight: 52 },
  hint: {
    fontSize: 11,
    lineHeight: 14,
    textAlign: "center",
    paddingHorizontal: 20,
  },
});

export default function EnvoisScreenGate() {
  return (
    <AuthGate>
      <EnvoisScreen />
    </AuthGate>
  );
}
