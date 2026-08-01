import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { colors } from "../../src/theme";

export default function RegisterScreen() {
  const { user, activated, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) {
    return (
      <Redirect href={activated ? "/(app)/entreprises" : "/(app)/recherche"} />
    );
  }

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        invite_code: invite.trim() || undefined,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.brand}>Inscription</Text>
      <View style={styles.card}>
        {[
          ["Nom", name, setName, false],
          ["Email", email, setEmail, false],
          ["Téléphone", phone, setPhone, false],
          ["Mot de passe", password, setPassword, true],
          ["Code invitation (opt.)", invite, setInvite, false],
        ].map(([label, value, setter, secure]) => (
          <View key={label as string} style={{ gap: 6 }}>
            <Text style={styles.label}>{label as string}</Text>
            <TextInput
              style={styles.input}
              value={value as string}
              onChangeText={setter as (v: string) => void}
              secureTextEntry={Boolean(secure)}
              autoCapitalize="none"
              placeholderTextColor="rgba(255,255,255,0.35)"
            />
          </View>
        ))}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.btn, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Créer mon compte</Text>
          )}
        </Pressable>
      </View>
      <Link href="/(auth)/login" style={styles.link}>
        Déjà un compte ? Connexion
      </Link>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: colors.bg,
    gap: 14,
  },
  brand: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    gap: 10,
  },
  label: { color: colors.muted, fontSize: 12, fontWeight: "700" },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  btn: {
    marginTop: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  error: { color: colors.danger, fontSize: 13 },
  link: {
    color: colors.accent,
    textAlign: "center",
    fontWeight: "600",
  },
});
