import { useEffect, useState } from "react";
import {
  ActionSheetIOS,
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
import { deleteContact, updateContactStatus, type ConversationDetail } from "../api";
import { CATEGORY_OPTIONS, EXTRA_LABEL_NAMES, categoryLabel } from "../format";
import { Group, Row, SectionHeader } from "../../ui/Apple";
import { useColors } from "../../theme";

/** Fiche contact — identité, statut CRM, étiquettes manuelles, suppression. */
export default function ContactSheetModal({
  visible,
  conversation,
  onClose,
  onSaved,
  onDeleted,
}: {
  visible: boolean;
  conversation: ConversationDetail | null;
  onClose: () => void;
  onSaved: (patch: Partial<ConversationDetail>) => void;
  onDeleted: () => void;
}) {
  const c = useColors();
  const [displayName, setDisplayName] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [email, setEmail] = useState("");
  const [projectSummary, setProjectSummary] = useState("");
  const [category, setCategory] = useState("nouveau");
  const [extras, setExtras] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!conversation) return;
    setDisplayName(conversation.name || "");
    setLinkedinUrl(conversation.linkedin_url || "");
    setEmail(conversation.email || "");
    setProjectSummary(conversation.project_summary || "");
    setCategory(conversation.category || "nouveau");
    const assigned = (conversation.labels || []).map((l) => l.name);
    setExtras(EXTRA_LABEL_NAMES.filter((name) => assigned.includes(name)));
  }, [conversation]);

  if (!conversation) return null;

  const pickCategory = () => {
    if (Platform.OS !== "ios") return;
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: [...CATEGORY_OPTIONS.map((o) => o.label), "Annuler"],
        cancelButtonIndex: CATEGORY_OPTIONS.length,
      },
      (index) => {
        if (index < CATEGORY_OPTIONS.length) {
          Haptics.selectionAsync().catch(() => {});
          setCategory(CATEGORY_OPTIONS[index].id);
        }
      },
    );
  };

  const toggleExtra = (name: string) => {
    Haptics.selectionAsync().catch(() => {});
    setExtras((cur) => (cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name]));
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await updateContactStatus(
        conversation.phone,
        {
          displayName: displayName.trim() || undefined,
          category,
          projectSummary: projectSummary.trim(),
          botEnabled: conversation.bot_enabled ?? true,
          linkedinUrl: linkedinUrl.trim(),
          email: email.trim(),
          extras,
        },
        conversation.sim_id,
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      onSaved({
        name: displayName.trim() || conversation.name,
        category,
        project_summary: projectSummary.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        email: email.trim() || null,
      });
      onClose();
    } catch (e) {
      Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    Alert.alert(
      "Supprimer le contact",
      `Supprimer définitivement ${conversation.name} et son historique ?`,
      [
        { text: "Annuler", style: "cancel" },
        {
          text: "Supprimer",
          style: "destructive",
          onPress: async () => {
            setDeleting(true);
            try {
              await deleteContact(conversation.phone);
              onDeleted();
            } catch (e) {
              Alert.alert("Erreur", e instanceof Error ? e.message : String(e));
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: c.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: c.accent }]}>Annuler</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.text }]}>Fiche contact</Text>
          <Pressable onPress={onSave} disabled={saving} hitSlop={10}>
            {saving ? (
              <ActivityIndicator size="small" color={c.accent} />
            ) : (
              <Text style={[styles.headerBtn, { color: c.accent, fontWeight: "700" }]}>Enregistrer</Text>
            )}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
          <SectionHeader title="Identité" />
          <Group>
            <TextInput
              style={[styles.input, { color: c.text, borderBottomColor: c.separator }]}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Nom"
              placeholderTextColor={c.muted}
            />
            <TextInput
              style={[styles.input, { color: c.text, borderBottomColor: c.separator }]}
              value={linkedinUrl}
              onChangeText={setLinkedinUrl}
              placeholder="Lien LinkedIn"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
            <TextInput
              style={[styles.input, { color: c.text }]}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={c.muted}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
            />
          </Group>

          <SectionHeader title="Résumé projet" />
          <Group>
            <TextInput
              style={[styles.textarea, { color: c.text }]}
              value={projectSummary}
              onChangeText={setProjectSummary}
              placeholder="Notes sur la recherche d'alternance…"
              placeholderTextColor={c.muted}
              multiline
              numberOfLines={4}
            />
          </Group>

          <SectionHeader title="Statut CRM" />
          <Group>
            <Row label="Catégorie" value={categoryLabel(category)} accentValue onPress={pickCategory} last />
          </Group>

          <SectionHeader title="Étiquettes manuelles" />
          <Group>
            {EXTRA_LABEL_NAMES.map((name, i) => (
              <Row
                key={name}
                label={name}
                switchValue={extras.includes(name)}
                onSwitchChange={() => toggleExtra(name)}
                last={i === EXTRA_LABEL_NAMES.length - 1}
              />
            ))}
          </Group>

          <View style={styles.deleteWrap}>
            <Group>
              <Row
                label="Supprimer le contact"
                destructive
                icon={{ name: "trash-outline", backgroundColor: c.danger }}
                onPress={deleting ? undefined : onDelete}
                last
              />
            </Group>
          </View>
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
  textarea: {
    fontSize: 15,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 90,
    textAlignVertical: "top",
  },
  deleteWrap: { marginTop: 24 },
});
