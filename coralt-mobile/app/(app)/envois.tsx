import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Redirect, useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import {
  fetchSheetProspects,
  regenerateMail,
  sendProspectMail,
  updateProspectStatus,
  type Prospect,
} from "../../src/api/mailing";
import { ApiError } from "../../src/api/http";
import { Banner, Button, EmptyState } from "../../src/ui/Apple";
import { hasEnvoisAccess } from "../../src/utils/planAccess";
import { colors } from "../../src/theme";

export default function EnvoisScreen() {
  const { user, activated, logout } = useAuth();
  const router = useRouter();
  const [deck, setDeck] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"send" | "skip" | "regen" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSwipe = activated && hasEnvoisAccess(user);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSheetProspects({
        email: user?.email,
        for_swipe: true,
        limit: 40,
      });
      setDeck(data.prospects);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
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
      if (canSwipe) load();
    }, [load, canSwipe]),
  );

  if (!activated) return <Redirect href="/(app)/recherche" />;
  if (!hasEnvoisAccess(user)) {
    return (
      <View style={styles.wrap}>
        <EmptyState
          title="Envois réservés au plan 3"
          subtitle="Passe au plan Complet pour swiper et envoyer."
        />
      </View>
    );
  }

  const current = deck[0];

  const skip = async () => {
    if (!current?.row_index || !user?.email) return;
    setBusy("skip");
    try {
      await updateProspectStatus({
        email: user.email,
        row_index: current.row_index,
        action: "no_contact",
      });
      setDeck((d) => d.slice(1));
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const send = async () => {
    if (!current?.row_index || !user?.email) return;
    setBusy("send");
    try {
      await sendProspectMail({
        email: user.email,
        row_index: current.row_index,
        subject: current.mailSubject || "",
        body: current.mailBody || "",
        target_email: current.email,
      });
      setDeck((d) => d.slice(1));
    } catch (e) {
      Alert.alert("Envoi impossible", e instanceof Error ? e.message : String(e));
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
    <View style={styles.wrap}>
      <Text style={styles.meta}>{deck.length} carte(s) prêtes</Text>
      {error ? (
        <Banner
          tone="error"
          title={error}
          subtitle="Toucher pour réessayer"
          onPress={load}
        />
      ) : null}

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 48 }} />
      ) : current ? (
        <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
          <View style={styles.card}>
            <Text style={styles.title}>
              {current.entreprise || "Entreprise"}
            </Text>
            <Text style={styles.sub}>
              {[current.ville, current.email, current.contact]
                .filter(Boolean)
                .join(" · ")}
            </Text>
            <View style={styles.divider} />
            <Text style={styles.mailLabel}>Objet</Text>
            <Text style={styles.mailSubject}>
              {current.mailSubject || "(sans objet)"}
            </Text>
            <Text style={styles.mailLabel}>Message</Text>
            <Text style={styles.mailBody}>
              {current.mailBody || "Pas de corps de mail."}
            </Text>
          </View>

          <Button
            label="Envoyer"
            loading={busy === "send"}
            disabled={!!busy}
            onPress={send}
          />
          <Button
            label="Régénérer le mail"
            variant="tinted"
            loading={busy === "regen"}
            disabled={!!busy}
            onPress={regen}
          />
          <Button
            label="Passer"
            variant="gray"
            loading={busy === "skip"}
            disabled={!!busy}
            onPress={skip}
          />
        </ScrollView>
      ) : (
        <EmptyState
          title="File vide"
          subtitle="Plus de candidatures prêtes. Reviens après une recherche."
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
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    gap: 8,
    minHeight: 280,
  },
  title: {
    color: colors.text,
    fontSize: 24,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(84,84,88,0.65)",
    marginVertical: 8,
  },
  mailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  mailSubject: { color: colors.text, fontSize: 16, fontWeight: "600" },
  mailBody: { color: "rgba(235,235,245,0.85)", fontSize: 15, lineHeight: 22 },
});
