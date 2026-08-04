import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { createContact } from "../api";
import { Group } from "../../ui/Apple";
import { useColors } from "../../theme";

/** Bouton "Nouveau message" — crée un contact CRM local puis ouvre le fil. */
export default function NewContactModal({
  visible,
  simId,
  onClose,
}: {
  visible: boolean;
  simId?: string;
  onClose: () => void;
}) {
  const c = useColors();
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);

  const close = () => {
    setPhone("");
    setDisplayName("");
    onClose();
  };

  const onCreate = async () => {
    const trimmed = phone.trim();
    if (!trimmed) return;
    setSaving(true);
    try {
      const result = await createContact({
        phone: trimmed,
        displayName: displayName.trim() || undefined,
        simId: simId && simId !== "all" ? simId : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      close();
      router.push(`/thread/${result.conversationKey}`);
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Pressable onPress={close} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: c.accent }]}>Annuler</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Nouveau message</Text>
          <Pressable onPress={onCreate} disabled={!phone.trim() || saving} hitSlop={10}>
            {saving ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : (
              <Text
                style={[
                  styles.headerBtn,
                  { color: phone.trim() ? c.accent : c.muted, fontWeight: "700" },
                ]}
              >
                Créer
              </Text>
            )}
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Group>
            <TextInput
              style={[styles.input, { color: c.text, borderBottomColor: c.separator }]}
              value={phone}
              onChangeText={setPhone}
              placeholder="Numéro de téléphone"
              placeholderTextColor={c.muted}
              keyboardType="phone-pad"
              autoFocus
            />
            <TextInput
              style={[styles.input, { color: c.text }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nom (optionnel)"
              placeholderTextColor={c.muted}
            />
          </Group>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  input: {
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
