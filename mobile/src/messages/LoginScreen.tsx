import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useMessagesAuth } from "./MessagesAuthContext";
import { Button } from "../ui/Apple";
import { useColors } from "../theme";

export default function MessagesLoginScreen() {
  const { login } = useMessagesAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [identifiant, setIdentifiant] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await login(identifiant.trim(), password);
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
      <View style={[styles.iconWrap, { backgroundColor: c.accent }]}>
        <Text style={styles.icon}>💬</Text>
      </View>
      <Text style={[styles.brand, { color: c.text }]}>Messages</Text>
      <Text style={[styles.sub, { color: c.muted }]}>
        Connexion à la messagerie SMS COR·ALT
      </Text>

      <View style={[styles.card, { backgroundColor: c.card }]}>
        <Text style={[styles.label, { color: c.muted }]}>Identifiant</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.searchBg, color: c.text }]}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="username"
          value={identifiant}
          onChangeText={setIdentifiant}
          placeholder="lucca ou ernest"
          placeholderTextColor={c.muted}
        />
        <Text style={[styles.label, { color: c.muted }]}>Mot de passe</Text>
        <TextInput
          style={[styles.input, { backgroundColor: c.searchBg, color: c.text }]}
          secureTextEntry
          textContentType="password"
          value={password}
          onChangeText={setPassword}
          placeholder="••••••••"
          placeholderTextColor={c.muted}
          onSubmitEditing={onSubmit}
        />
        {error ? (
          <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
        ) : null}
        <Button
          label="Se connecter"
          loading={busy}
          disabled={!identifiant || !password}
          onPress={onSubmit}
        />
      </View>
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
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 4,
  },
  icon: { fontSize: 30 },
  brand: {
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  sub: { fontSize: 14, marginBottom: 6, textAlign: "center" },
  card: {
    borderRadius: 14,
    padding: 18,
    gap: 10,
  },
  label: { fontSize: 13, fontWeight: "600" },
  input: {
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 17,
    minHeight: 48,
  },
  error: { fontSize: 14 },
});
