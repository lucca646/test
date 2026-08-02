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

function RechercheScreen() {
  const { user, activated, refreshUser } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
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
      style={{ flex: 1, backgroundColor: c.bg }}
      contentContainerStyle={{
        paddingTop: Math.max(insets.top, 8),
        paddingBottom: TAB_BAR_CLEARANCE + insets.bottom,
        gap: 10,
      }}
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
          <Text style={[styles.label, { color: c.muted }]}>Secteur</Text>
          <TextInput
            style={[styles.input, { color: c.text }]}
            value={secteur}
            onChangeText={setSecteur}
            onEndEditing={onSuggest}
            placeholder="ex. développement web"
            placeholderTextColor={c.muted}
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
          style={[styles.area, { color: c.text }]}
          multiline
          value={profile}
          onChangeText={setProfile}
          placeholder="Le texte de recherche apparaîtra ici"
          placeholderTextColor={c.muted}
        />
      </Group>

      <View style={styles.pad}>
        <Button
          label="Lancer la recherche"
          loading={busy === "send"}
          disabled={!secteur.trim() && !profile.trim()}
          onPress={onSend}
        />
        {status ? (
          <Text style={[styles.status, { color: c.muted }]}>{status}</Text>
        ) : null}
        {busy ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 8 }} />
        ) : null}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  field: { paddingHorizontal: 16, paddingVertical: 12, gap: 6 },
  fieldBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
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
    borderRadius: 999,
    minHeight: 40,
    justifyContent: "center",
  },
  chipText: { fontSize: 13, fontWeight: "600" },
  pad: { paddingHorizontal: 16, gap: 10, marginTop: 4 },
  status: { fontSize: 14, textAlign: "center" },
});

export default function RechercheScreenGate() {
  return (
    <AuthGate>
      <RechercheScreen />
    </AuthGate>
  );
}
