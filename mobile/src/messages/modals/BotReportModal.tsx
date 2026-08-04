import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import {
  BOT_REPORT_REASONS,
  BOT_REPORT_REASON_LABELS,
  submitBotReport,
  type BotReportReason,
} from "../api";
import { useColors } from "../../theme";

/** Bouton "Signaler le bot" — journalise le contexte pour revue humaine (pas de coupure auto). */
export default function BotReportModal({
  visible,
  number,
  simId,
  onClose,
}: {
  visible: boolean;
  number: string | null;
  simId?: string;
  onClose: () => void;
}) {
  const c = useColors();
  const [reason, setReason] = useState<BotReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  const close = () => {
    setReason(null);
    setNote("");
    onClose();
  };

  const onSubmit = async () => {
    if (!number || !reason) return;
    setSending(true);
    try {
      const result = await submitBotReport(number, { reason, note: note.trim() || undefined }, simId);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert("Signalement envoyé", result.message);
      close();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={close}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Pressable onPress={close} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: c.accent }]}>Annuler</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Signaler le bot</Text>
          <Pressable onPress={onSubmit} disabled={!reason || sending} hitSlop={10}>
            {sending ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : (
              <Text
                style={[
                  styles.headerBtn,
                  { color: reason ? c.accent : c.muted, fontWeight: "700" },
                ]}
              >
                Envoyer
              </Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={[styles.sectionLabel, { color: c.muted }]}>QUEL EST LE PROBLÈME ?</Text>
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            {BOT_REPORT_REASONS.map((r, i) => (
              <Pressable
                key={r}
                onPress={() => {
                  Haptics.selectionAsync().catch(() => {});
                  setReason(r);
                }}
                style={[
                  styles.reasonRow,
                  i < BOT_REPORT_REASONS.length - 1 && {
                    borderBottomWidth: StyleSheet.hairlineWidth,
                    borderBottomColor: c.separator,
                  },
                ]}
              >
                <Text style={[styles.reasonLabel, { color: c.text }]}>
                  {BOT_REPORT_REASON_LABELS[r]}
                </Text>
                {reason === r ? (
                  <Ionicons name="checkmark-circle" size={22} color={c.accent} />
                ) : (
                  <View style={[styles.radioEmpty, { borderColor: c.border }]} />
                )}
              </Pressable>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: c.muted, marginTop: 20 }]}>
            NOTE (OPTIONNEL)
          </Text>
          <View style={[styles.group, { backgroundColor: c.card, borderColor: c.border }]}>
            <TextInput
              style={[styles.textarea, { color: c.text }]}
              value={note}
              onChangeText={setNote}
              placeholder="Détails utiles pour l'analyse…"
              placeholderTextColor={c.muted}
              multiline
              numberOfLines={3}
            />
          </View>
          <Text style={[styles.hint, { color: c.muted }]}>
            Le bot reste actif — le signalement sert à faire évoluer ses réponses.
          </Text>
        </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerBtn: { fontSize: 16 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  body: { padding: 16 },
  sectionLabel: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4, marginBottom: 8 },
  group: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: "hidden" },
  reasonRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  reasonLabel: { fontSize: 15, flex: 1, marginRight: 8 },
  radioEmpty: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5 },
  textarea: { fontSize: 15, padding: 14, minHeight: 80, textAlignVertical: "top" },
  hint: { fontSize: 12, marginTop: 10, lineHeight: 16 },
});
