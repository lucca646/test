import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { listRelaunchTemplates, sendMessageToContact, type RelaunchTemplate } from "../api";
import { applyRelaunchTemplate } from "../format";
import { EmptyState } from "../../ui/Apple";
import { useColors } from "../../theme";

/** Bouton "Relancer" — modèles préréglés, {prenom} rempli côté client. */
export default function RelaunchModal({
  visible,
  number,
  contactName,
  simId,
  onClose,
  onSent,
}: {
  visible: boolean;
  number: string | null;
  contactName?: string | null;
  simId?: string;
  onClose: () => void;
  onSent: () => void;
}) {
  const c = useColors();
  const [templates, setTemplates] = useState<RelaunchTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    listRelaunchTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [visible]);

  const onPick = async (template: RelaunchTemplate) => {
    if (!number) return;
    const text = applyRelaunchTemplate(template.text, contactName);
    setSendingId(template.id);
    try {
      await sendMessageToContact({ number, text, simId });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSent();
      onClose();
    } catch (e) {
      Alert.alert("Erreur d'envoi", e instanceof Error ? e.message : String(e));
    } finally {
      setSendingId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Text style={[styles.headerTitle, { color: c.text }]}>Relancer</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: c.accent }]}>Fermer</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : error ? (
          <EmptyState title="Indisponible" subtitle={error} />
        ) : templates.length === 0 ? (
          <EmptyState title="Aucun modèle" subtitle="Ajoutez des modèles depuis la PWA." />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            <Text style={[styles.hint, { color: c.muted }]}>
              {"{prenom}"} sera remplacé par le prénom du contact.
            </Text>
            {templates.map((t) => (
              <Pressable
                key={t.id}
                disabled={!!sendingId}
                onPress={() => onPick(t)}
                style={({ pressed }) => [
                  styles.item,
                  { backgroundColor: c.card, borderColor: c.border },
                  pressed && { opacity: 0.7 },
                ]}
              >
                <Text style={[styles.itemText, { color: c.text }]}>
                  {applyRelaunchTemplate(t.text, contactName)}
                </Text>
                {sendingId === t.id ? (
                  <ActivityIndicator size="small" color={c.accent} />
                ) : (
                  <Ionicons name="send" size={18} color={c.accent} />
                )}
              </Pressable>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  headerBtn: { fontSize: 16 },
  list: { padding: 16, gap: 10 },
  hint: { fontSize: 12, marginBottom: 4 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemText: { fontSize: 15, flex: 1, lineHeight: 20 },
});
