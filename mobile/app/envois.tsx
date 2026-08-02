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
import { Banner, EmptyState } from "../src/ui/Apple";
import SwipeDeck from "../src/ui/SwipeDeck";
import { hasEnvoisAccess } from "../src/utils/planAccess";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";

const PAGE_SIZE = 10;
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
        return;
      }
      setError(e instanceof Error ? e.message : String(e));
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
      /* silencieux */
    } finally {
      fetchingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      if (canSwipe) void loadInitial();
    }, [loadInitial, canSwipe]),
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
  const advance = () => setDeck((d) => d.slice(1));

  const skip = async (p: Prospect = current!) => {
    if (!p?.row_index || !user?.email) return;
    setBusy("skip");
    setError(null);
    try {
      await updateProspectStatus({
        email: user.email,
        row_index: p.row_index,
        action: "no_contact",
      });
      advance();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const send = async (p: Prospect = current!) => {
    if (!p?.row_index || !user?.email) return;
    setBusy("send");
    setError(null);
    try {
      await sendProspectMail({
        email: user.email,
        row_index: p.row_index,
        subject: p.mailSubject || "",
        body: p.mailBody || "",
        target_email: p.email,
      });
      advance();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const gmail = /gmail|oauth|token|autoris/i.test(msg);
      setError(gmail ? `Gmail : ${msg}` : msg);
      // carte reste — pas d'advance
    } finally {
      setBusy(null);
    }
  };

  const regen = async () => {
    if (!current?.row_index || !user?.email) return;
    setBusy("regen");
    setError(null);
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
      <View style={styles.header}>
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={[styles.largeTitle, { color: c.text }]}>
            À envoyer
          </Text>
          <Text style={[styles.headerSub, { color: c.muted }]}>
            {deck.length === 0
              ? "Rien en attente pour l’instant"
              : deck.length === 1
                ? "1 restante aujourd’hui"
                : `${deck.length} restantes aujourd’hui`}
            {total > deck.length ? ` · ${total} au total` : ""}
          </Text>
        </View>
        {loadingMore ? (
          <ActivityIndicator color={c.accent} size="small" />
        ) : null}
      </View>

      {error ? (
        <Banner
          tone="error"
          title={error}
          subtitle="Toucher pour réessayer l’envoi"
          onPress={() => {
            if (current) void send(current);
            else void loadInitial();
          }}
        />
      ) : null}

      <View style={styles.stage}>
        {loading ? (
          <ActivityIndicator color={c.accent} />
        ) : current ? (
          <SwipeDeck
            prospects={deck}
            disabled={!!busy}
            busy={busy}
            onSend={send}
            onSkip={skip}
            onRegen={regen}
          />
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 8,
    minHeight: 36,
  },
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  headerSub: { fontSize: 14, lineHeight: 18 },
  stage: { flex: 1, justifyContent: "center" },
});

export default function EnvoisScreenGate() {
  return (
    <AuthGate>
      <EnvoisScreen />
    </AuthGate>
  );
}
