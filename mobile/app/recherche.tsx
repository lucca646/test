import { useCallback, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../src/auth/AuthContext";
import AuthGate from "../src/screens/AuthGate";
import {
  apiNafSuggest,
  apiSearchProfileCompose,
  apiSearchQueueStatus,
  apiSendSearch,
} from "../src/api/console";
import { Banner, Button, Group, SectionHeader } from "../src/ui/Apple";
import { TAB_BAR_CLEARANCE, useColors } from "../src/theme";

type Step = "idle" | "ready" | "queued";

function RechercheScreen() {
  const { user, activated, refreshUser } = useAuth();
  const router = useRouter();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [secteur, setSecteur] = useState("");
  const [zone, setZone] = useState("");
  const [profile, setProfile] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [queueLabel, setQueueLabel] = useState<string | null>(null);
  const [queueRunning, setQueueRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<"compose" | "send" | null>(
    null,
  );
  const [busy, setBusy] = useState<"compose" | "send" | null>(null);
  const [editingTarget, setEditingTarget] = useState(false);

  const refreshQueue = useCallback(async () => {
    try {
      const data = await apiSearchQueueStatus(user?.email);
      const done = Number(data.done ?? data.completed ?? 0);
      const total = Number(data.total ?? data.pending_total ?? 0);
      const running = Boolean(data.running ?? data.active);
      setQueueRunning(running);
      if (total > 0 || running) {
        setQueueLabel(
          running
            ? `File active · ${done}/${total || "?"}`
            : `Dernière file · ${done}/${total || "?"}`,
        );
      } else {
        setQueueLabel(null);
      }
    } catch {
      /* ignore */
    }
  }, [user?.email]);

  useFocusEffect(
    useCallback(() => {
      refreshQueue();
    }, [refreshQueue]),
  );

  const step: Step = queueRunning
    ? "queued"
    : profile.trim()
      ? "ready"
      : "idle";

  const showTargetForm = step === "idle" || editingTarget;

  const onSuggest = async () => {
    if (!secteur.trim()) return;
    try {
      const data = await apiNafSuggest(secteur.trim());
      const items =
        (data.suggestions as string[]) ||
        (data.items as string[]) ||
        (data.results as { label?: string; libelle?: string }[])?.map(
          (x) => x.label || x.libelle || "",
        ) ||
        [];
      setSuggestions(items.filter(Boolean).slice(0, 10));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRetryAction("compose");
    }
  };

  const onCompose = async () => {
    if (!secteur.trim() || !zone.trim()) {
      setError("Indique un secteur et une zone.");
      setRetryAction("compose");
      return;
    }
    setBusy("compose");
    setError(null);
    setRetryAction(null);
    try {
      const data = await apiSearchProfileCompose({
        email: user?.email,
        secteur: secteur.trim(),
        zone: zone.trim(),
        fast: true,
      });
      const text =
        (data.profile_text as string) ||
        (data.text as string) ||
        (data.composed as string) ||
        "";
      setProfile(text || JSON.stringify(data).slice(0, 500));
      setEditingTarget(false);
      setSuggestions([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRetryAction("compose");
    } finally {
      setBusy(null);
    }
  };

  const onSend = async () => {
    if (!profile.trim()) return;
    setBusy("send");
    setError(null);
    setRetryAction(null);
    try {
      await apiSendSearch({
        email: user?.email,
        secteur: secteur.trim(),
        zone: zone.trim(),
        profile_text: profile,
      });
      await refreshUser();
      await refreshQueue();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setRetryAction("send");
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
        gap: 12,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.largeTitle, { color: c.text }]}>Recherche</Text>

      {!activated ? (
        <Banner
          tone="info"
          title="Compte non activé"
          subtitle="Tu peux déjà composer un ciblage. L’activation débloque le lancement."
        />
      ) : null}

      {step === "queued" && queueLabel ? (
        <Banner
          tone="success"
          title="Recherche en cours"
          subtitle={queueLabel}
          onPress={() => router.push("/entreprises")}
        />
      ) : null}

      {error ? (
        <Banner
          tone="error"
          title={error}
          subtitle={
            retryAction === "compose"
              ? "Toucher pour réessayer Composer"
              : retryAction === "send"
                ? "Toucher pour réessayer Lancer"
                : undefined
          }
          onPress={() => {
            if (retryAction === "compose") void onCompose();
            else if (retryAction === "send") void onSend();
          }}
        />
      ) : null}

      {step === "queued" ? (
        <View style={styles.pad}>
          <Button
            label="Voir les entreprises"
            onPress={() => router.push("/entreprises")}
          />
        </View>
      ) : null}

      {/* Ciblage */}
      {(step === "ready" || step === "queued") && !showTargetForm ? (
        <Pressable
          onPress={() => {
            if (step === "ready") setEditingTarget(true);
          }}
          style={[styles.summary, { backgroundColor: c.card, borderColor: c.border }]}
        >
          <Text style={[styles.summaryLabel, { color: c.muted }]}>
            Qui cherches-tu ?
          </Text>
          <Text style={[styles.summaryValue, { color: c.text }]} numberOfLines={2}>
            {[secteur, zone].filter(Boolean).join(" · ") || "—"}
          </Text>
          {step === "ready" ? (
            <Text style={{ color: c.accent, fontSize: 14, fontWeight: "600" }}>
              Modifier
            </Text>
          ) : null}
        </Pressable>
      ) : (
        <>
          <SectionHeader title="Qui cherches-tu ?" />
          <Group>
            <View style={styles.field}>
              <Text style={[styles.label, { color: c.muted }]}>Secteur</Text>
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={secteur}
                onChangeText={setSecteur}
                onEndEditing={onSuggest}
                placeholder="ex. développement web"
                placeholderTextColor={c.muted}
                editable={step !== "queued"}
              />
            </View>
            <View
              style={[
                styles.field,
                styles.fieldBorder,
                { borderTopColor: c.border },
              ]}
            >
              <Text style={[styles.label, { color: c.muted }]}>Zone</Text>
              <TextInput
                style={[styles.input, { color: c.text }]}
                value={zone}
                onChangeText={setZone}
                placeholder="ex. Lyon, Rhône"
                placeholderTextColor={c.muted}
                editable={step !== "queued"}
              />
            </View>
          </Group>

          {suggestions.length ? (
            <View style={styles.chips}>
              {suggestions.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.chip, { backgroundColor: c.pillBg }]}
                  onPress={() => {
                    setSecteur(s);
                    setSuggestions([]);
                  }}
                >
                  <Text style={[styles.chipText, { color: c.accent }]}>{s}</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}

      {/* CTA idle = Composer uniquement */}
      {step === "idle" ? (
        <View style={styles.pad}>
          <Button
            label="Composer le profil"
            loading={busy === "compose"}
            disabled={!secteur.trim() || !zone.trim() || !!busy}
            onPress={onCompose}
          />
        </View>
      ) : null}

      {/* Profil + Lancer — seulement après compose */}
      {(step === "ready" || step === "queued") && (
        <>
          <SectionHeader title="Profil de recherche" />
          <Group>
            <TextInput
              style={[styles.area, { color: c.text }]}
              multiline
              value={profile}
              onChangeText={setProfile}
              editable={step === "ready"}
              placeholder="Le texte de recherche apparaîtra ici"
              placeholderTextColor={c.muted}
            />
          </Group>

          {step === "ready" ? (
            <View style={styles.pad}>
              <Button
                label="Lancer la recherche"
                loading={busy === "send"}
                disabled={!profile.trim() || !!busy}
                onPress={onSend}
              />
              <Pressable
                onPress={() => void onCompose()}
                disabled={!!busy}
                style={styles.secondaryLink}
              >
                <Text style={{ color: c.accent, fontSize: 16, fontWeight: "600" }}>
                  Recomposer
                </Text>
              </Pressable>
            </View>
          ) : null}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  largeTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
    marginHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  field: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  fieldBorder: { borderTopWidth: StyleSheet.hairlineWidth },
  label: { fontSize: 13, fontWeight: "600" },
  input: { fontSize: 17, paddingVertical: 6, minHeight: 36 },
  area: {
    fontSize: 16,
    minHeight: 140,
    padding: 16,
    textAlignVertical: "top",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    paddingHorizontal: 16,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minHeight: 44,
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  pad: { paddingHorizontal: 16, gap: 10, marginTop: 4 },
  summary: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  summaryLabel: { fontSize: 13, fontWeight: "600" },
  summaryValue: { fontSize: 17, fontWeight: "600" },
  secondaryLink: {
    alignItems: "center",
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: "center",
  },
});

export default function RechercheScreenGate() {
  return (
    <AuthGate>
      <RechercheScreen />
    </AuthGate>
  );
}
