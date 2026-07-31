import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Link, Redirect } from "expo-router";
import { useAuth } from "../../src/auth/AuthContext";
import { API_URL } from "../../src/config";
import { Button } from "../../src/ui/Apple";
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
      <Text style={styles.sub}>
        Connexion native · {API_URL.replace("https://", "")}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Email ou identifiant</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@email.fr"
          placeholderTextColor="rgba(235,235,245,0.3)"
        />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor="rgba(235,235,245,0.3)"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Se connecter"
          loading={busy}
          disabled={!email || !password}
          onPress={onSubmit}
        />
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
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  sub: { color: colors.muted, fontSize: 14, marginBottom: 8 },
  card: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  label: { color: colors.muted, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.text,
    fontSize: 17,
  },
  error: { color: colors.danger, fontSize: 14 },
  link: {
    color: colors.accent,
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    marginTop: 8,
  },
});
