import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../src/auth/AuthContext";
import AuthGate from "../src/screens/AuthGate";
import {
  apiNafSuggest,
  apiSearchProfileCompose,
  apiSearchQueueStatus,
  apiSendSearch,
} from "../src/api/console";
import { Banner, Button, Group, SectionHeader } from "../src/ui/Apple";
import { colors } from "../src/theme";

function RechercheScreen() {
  const { user, activated, refreshUser } = useAuth();
  const [secteur, setSecteur] = useState("");
  const [zone, setZone] = useState("");
  const [profile, setProfile] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [queueLabel, setQueueLabel] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<"compose" | "send" | null>(null);

  const refreshQueue = useCallback(async () => {
    try {
      const data = await apiSearchQueueStatus(user?.email);
      const done = Number(data.done ?? data.completed ?? 0);
      const total = Number(data.total ?? data.pending_total ?? 0);
      const running = Boolean(data.running ?? data.active);
      if (total > 0 || running) {
        setQueueLabel(
          running
            ? `File active · ${done}/${total || "?"}`
            : `Dernière file · ${done}/${total || "?"}`,
        );
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
      setStatus(e instanceof Error ? e.message : String(e));
    }
  };

  const onCompose = async () => {
    setBusy("compose");
    setStatus(null);
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
      setStatus("Profil composé.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  const onSend = async () => {
    setBusy("send");
    setStatus(null);
    try {
      await apiSendSearch({
        email: user?.email,
        secteur: secteur.trim(),
        zone: zone.trim(),
        profile_text: profile,
      });
      await refreshUser();
      await refreshQueue();
      setStatus("Recherche lancée.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={styles.wrap}
      keyboardShouldPersistTaps="handled"
    >
      {!activated ? (
        <Banner
          tone="info"
          title="Compte non activé"
          subtitle="Configure ton ciblage ici. Le paiement d’activation arrive au lot suivant."
        />
      ) : null}

      {queueLabel ? (
        <Banner tone="success" title="Recherche" subtitle={queueLabel} />
      ) : null}

      <SectionHeader title="Ciblage" />
      <Group>
        <View style={styles.field}>
          <Text style={styles.label}>Secteur</Text>
          <TextInput
            style={styles.input}
            value={secteur}
            onChangeText={setSecteur}
            onEndEditing={onSuggest}
            placeholder="ex. développement web"
            placeholderTextColor="rgba(235,235,245,0.3)"
          />
        </View>
        <View style={[styles.field, styles.fieldBorder]}>
          <Text style={styles.label}>Zone</Text>
          <TextInput
            style={styles.input}
            value={zone}
            onChangeText={setZone}
            placeholder="ex. Lyon, Rhône"
            placeholderTextColor="rgba(235,235,245,0.3)"
          />
        </View>
      </Group>

      {suggestions.length ? (
        <View style={styles.chips}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              style={styles.chip}
              onPress={() => {
                setSecteur(s);
                setSuggestions([]);
              }}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View style={styles.pad}>
        <Button
          label="Composer le profil"
          variant="tinted"
          loading={busy === "compose"}
          onPress={onCompose}
        />
      </View>

      <SectionHeader title="Profil généré" />
      <Group>
        <TextInput
          style={styles.area}
          multiline
          value={profile}
          onChangeText={setProfile}
          placeholder="Le texte de recherche apparaîtra ici"
          placeholderTextColor="rgba(235,235,245,0.3)"
        />
      </Group>

      <View style={styles.pad}>
        <Button
          label="Lancer la recherche"
          loading={busy === "send"}
          disabled={!secteur.trim() && !profile.trim()}
          onPress={onSend}
        />
        {status ? <Text style={styles.status}>{status}</Text> : null}
        {busy ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 8 }} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingBottom: 40, gap: 10 },
  field: { paddingHorizontal: 16, paddingVertical: 10, gap: 6 },
  fieldBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(84,84,88,0.65)",
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  input: { color: colors.text, fontSize: 17, paddingVertical: 4 },
  area: {
    color: colors.text,
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
    backgroundColor: "rgba(10,132,255,0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  pad: { paddingHorizontal: 16, gap: 10, marginTop: 4 },
  status: { color: colors.muted, fontSize: 14, textAlign: "center" },
});


export default function RechercheScreenGate() {
  return (
    <AuthGate>
      <RechercheScreen />
    </AuthGate>
  );
}
