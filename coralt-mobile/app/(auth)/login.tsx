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
import { API_URL } from "../../src/config";
import { colors } from "../../src/theme";

export default function LoginScreen() {
  const { user, activated, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      await login(email.trim(), password);
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
      <Text style={styles.brand}>COR·ALT</Text>
      <Text style={styles.sub}>Connexion native · {API_URL.replace("https://", "")}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email ou identifiant</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@email.fr"
          placeholderTextColor="rgba(255,255,255,0.35)"
        />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="rgba(255,255,255,0.35)"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.btn, busy && { opacity: 0.6 }]}
          onPress={onSubmit}
          disabled={busy || !email || !password}
        >
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>Se connecter</Text>
          )}
        </Pressable>
      </View>

      <Link href="/(auth)/register" style={styles.link}>
        Créer un compte
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
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: -1,
  },
  sub: { color: colors.muted, fontSize: 13, marginBottom: 8 },
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
    marginTop: 8,
  },
});
