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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { getApiBaseLabel } from "../api/auth";
import { Button } from "../ui/Apple";
import { useColors } from "../theme";
import { otaDebugLabel } from "../../lib/ota";

type Props = {
  onGoRegister?: () => void;
};

/** Écran login — composant (pas une route) pour ne jamais démonter NativeTabs. */
export default function LoginScreen({ onGoRegister }: Props) {
  const { login } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
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
      style={[
        styles.wrap,
        {
          backgroundColor: c.bg,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        },
      ]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={[styles.brand, { color: c.text }]}>COR·ALT</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        Connexion native · {getApiBaseLabel()}
      </Text>
      <Text style={[styles.ota, { color: c.muted }]}>
        build {otaDebugLabel()}
      </Text>

      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.label, { color: c.muted }]}>
          Email ou identifiant
        </Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: c.searchBg, color: c.text },
          ]}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          value={email}
          onChangeText={setEmail}
          placeholder="vous@email.fr"
          placeholderTextColor={c.muted}
        />
        <Text style={[styles.label, { color: c.muted }]}>Mot de passe</Text>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: c.searchBg, color: c.text },
          ]}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={c.muted}
        />
        {error ? (
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        ) : null}
        <Button
          label="Se connecter"
          loading={busy}
          disabled={!email || !password}
          onPress={onSubmit}
        />
      </View>

      {onGoRegister ? (
        <Pressable onPress={onGoRegister} hitSlop={8}>
          <Text style={[styles.link, { color: c.accent }]}>
            Créer un compte
          </Text>
        </Pressable>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  brand: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  sub: { fontSize: 14, marginBottom: 2 },
  ota: {
    fontSize: 11,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    marginBottom: 8,
  },
  card: {
    borderRadius: 16,
    padding: 18,
    gap: 10,
  },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    minHeight: 48,
  },
  error: { fontSize: 14 },
  link: {
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
    marginTop: 8,
    paddingVertical: 8,
  },
});
