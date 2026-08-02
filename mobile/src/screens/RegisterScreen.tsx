import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { Button } from "../ui/Apple";
import { useColors } from "../theme";

type Props = {
  onGoLogin?: () => void;
};

export default function RegisterScreen({ onGoLogin }: Props) {
  const { register } = useAuth();
  const c = useColors();
  const insets = useSafeAreaInsets();
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
      style={{ flex: 1, backgroundColor: c.bg }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.wrap,
          {
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.brand, { color: c.text }]}>COR·ALT</Text>
        <Text style={[styles.sub, { color: c.muted }]}>Créer un compte</Text>

        <View style={[styles.card, { backgroundColor: c.card }]}>
          <Text style={[styles.label, { color: c.muted }]}>Nom</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.searchBg, color: c.text },
            ]}
            value={name}
            onChangeText={setName}
            placeholderTextColor={c.muted}
            placeholder="Prénom Nom"
          />
          <Text style={[styles.label, { color: c.muted }]}>Email</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.searchBg, color: c.text },
            ]}
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            placeholderTextColor={c.muted}
            placeholder="vous@email.fr"
          />
          <Text style={[styles.label, { color: c.muted }]}>Téléphone</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.searchBg, color: c.text },
            ]}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={setPhone}
            placeholderTextColor={c.muted}
            placeholder="06…"
          />
          <Text style={[styles.label, { color: c.muted }]}>Mot de passe</Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.searchBg, color: c.text },
            ]}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholderTextColor={c.muted}
            placeholder="••••••••"
          />
          <Text style={[styles.label, { color: c.muted }]}>
            Code invitation
          </Text>
          <TextInput
            style={[
              styles.input,
              { backgroundColor: c.searchBg, color: c.text },
            ]}
            autoCapitalize="characters"
            value={invite}
            onChangeText={setInvite}
            placeholderTextColor={c.muted}
            placeholder="Optionnel"
          />
          {error ? (
            <Text style={[styles.error, { color: c.danger }]}>{error}</Text>
          ) : null}
          <Button
            label="Créer le compte"
            loading={busy}
            disabled={!name || !email || !password}
            onPress={onSubmit}
          />
        </View>

        {onGoLogin ? (
          <Pressable onPress={onGoLogin} hitSlop={8}>
            <Text style={[styles.link, { color: c.accent }]}>
              Déjà un compte ? Connexion
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  brand: {
    fontSize: 40,
    fontWeight: "800",
    letterSpacing: -1.2,
  },
  sub: { fontSize: 14, marginBottom: 8 },
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
