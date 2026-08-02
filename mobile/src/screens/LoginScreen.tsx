import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useAuth } from "../auth/AuthContext";
import { getApiBaseLabel } from "../api/auth";
import { Button } from "../ui/Apple";
import { colors } from "../theme";
import { otaDebugLabel } from "../../lib/ota";

type Props = {
  onGoRegister?: () => void;
};

/** Écran login — composant (pas une route) pour ne jamais démonter NativeTabs. */
export default function LoginScreen({ onGoRegister }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      <Text style={styles.sub}>Connexion native · {getApiBaseLabel()}</Text>
      <Text style={styles.ota}>build {otaDebugLabel()}</Text>

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

      {onGoRegister ? (
        <Pressable onPress={onGoRegister}>
          <Text style={styles.link}>Créer un compte</Text>
        </Pressable>
      ) : null}
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
  sub: { color: colors.muted, fontSize: 14, marginBottom: 2 },
  ota: {
    color: "rgba(235,235,245,0.35)",
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
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
