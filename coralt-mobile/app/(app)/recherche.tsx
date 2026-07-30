import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../../src/auth/AuthContext";
import {
  apiNafSuggest,
  apiSearchProfileCompose,
  apiSendSearch,
} from "../../src/api/console";
import { colors } from "../../src/theme";

export default function RechercheScreen() {
  const { user, activated, refreshUser } = useAuth();
  const [secteur, setSecteur] = useState("");
  const [zone, setZone] = useState("");
  const [profile, setProfile] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSuggest = async () => {
    if (!secteur.trim()) return;
    try {
      const data = await apiNafSuggest(secteur.trim());
      const items =
        (data.suggestions as string[]) ||
        (data.items as string[]) ||
        (data.results as { label?: string }[])?.map((x) => x.label || "") ||
        [];
      setSuggestions(items.filter(Boolean).slice(0, 8));
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    }
  };

  const onCompose = async () => {
    setBusy(true);
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
        JSON.stringify(data).slice(0, 400);
      setProfile(text);
      setStatus("Profil composé.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const onSend = async () => {
    setBusy(true);
    setStatus(null);
    try {
      await apiSendSearch({
        email: user?.email,
        secteur: secteur.trim(),
        zone: zone.trim(),
        profile_text: profile,
      });
      await refreshUser();
      setStatus("Recherche lancée (file APE).");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.wrap}>
      {!activated ? (
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Compte non activé</Text>
          <Text style={styles.bannerText}>
            Complète le ciblage ici. Le paiement d’activation (Checkout) sera
            branché au lot E.
          </Text>
        </View>
      ) : null}

      <Text style={styles.label}>Secteur</Text>
      <TextInput
        style={styles.input}
        value={secteur}
        onChangeText={setSecteur}
        onEndEditing={onSuggest}
        placeholder="ex. développement web"
        placeholderTextColor="rgba(255,255,255,0.35)"
      />
      {suggestions.length ? (
        <View style={styles.chips}>
          {suggestions.map((s) => (
            <Pressable
              key={s}
              style={styles.chip}
              onPress={() => setSecteur(s)}
            >
              <Text style={styles.chipText}>{s}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <Text style={styles.label}>Zone</Text>
      <TextInput
        style={styles.input}
        value={zone}
        onChangeText={setZone}
        placeholder="ex. Paris, Île-de-France"
        placeholderTextColor="rgba(255,255,255,0.35)"
      />

      <Pressable style={styles.btnSecondary} onPress={onCompose} disabled={busy}>
        <Text style={styles.btnText}>Composer le profil</Text>
      </Pressable>

      <Text style={styles.label}>Profil généré</Text>
      <TextInput
        style={[styles.input, styles.area]}
        multiline
        value={profile}
        onChangeText={setProfile}
        placeholderTextColor="rgba(255,255,255,0.35)"
      />

      <Pressable style={styles.btn} onPress={onSend} disabled={busy}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.btnText}>Lancer la recherche</Text>
        )}
      </Pressable>

      {status ? <Text style={styles.status}>{status}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 16, gap: 10, backgroundColor: colors.bg },
  banner: {
    backgroundColor: "rgba(10,132,255,0.15)",
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(10,132,255,0.4)",
    marginBottom: 6,
  },
  bannerTitle: { color: colors.text, fontWeight: "800", marginBottom: 4 },
  bannerText: { color: colors.muted, fontSize: 13, lineHeight: 18 },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  input: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  area: { minHeight: 120, textAlignVertical: "top" },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    backgroundColor: "rgba(10,132,255,0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
  },
  chipText: { color: colors.text, fontSize: 12 },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 4,
  },
  btnSecondary: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  status: { color: colors.muted, fontSize: 13, marginTop: 6 },
});
