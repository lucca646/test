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
import { Button } from "../ui/Apple";
import { colors } from "../theme";

type Props = {
  onGoLogin?: () => void;
};

export default function RegisterScreen({ onGoLogin }: Props) {
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [invite, setInvite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async () => {
    setBusy(true);
    setError(null);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim() || undefined,
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
      <Text style={styles.brand}>COR·ALT</Text>
      <Text style={styles.sub}>Créer un compte</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholderTextColor="rgba(235,235,245,0.3)"
          placeholder="Prénom Nom"
        />
        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
          placeholderTextColor="rgba(235,235,245,0.3)"
          placeholder="vous@email.fr"
        />
        <Text style={styles.label}>Téléphone</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          placeholderTextColor="rgba(235,235,245,0.3)"
          placeholder="06…"
        />
        <Text style={styles.label}>Mot de passe</Text>
        <TextInput
          style={styles.input}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          placeholderTextColor="rgba(235,235,245,0.3)"
          placeholder="••••••••"
        />
        <Text style={styles.label}>Code invitation</Text>
        <TextInput
          style={styles.input}
          autoCapitalize="characters"
          value={invite}
          onChangeText={setInvite}
          placeholderTextColor="rgba(235,235,245,0.3)"
          placeholder="Optionnel"
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button
          label="Créer le compte"
          loading={busy}
          disabled={!name || !email || !password}
          onPress={onSubmit}
        />
      </View>

      {onGoLogin ? (
        <Pressable onPress={onGoLogin}>
          <Text style={styles.link}>Déjà un compte ? Connexion</Text>
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
