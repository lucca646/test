import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Prospect } from "../api/mailing";
import { useColors } from "../theme";
import {
  entreprisesCanToggleContactStatus,
  entreprisesShowContacts,
  entreprisesShowMailActions,
  type CoraltUser,
} from "../utils/planAccess";
import {
  isSentStatut,
  prospectStatusKind,
  prospectStatusLabel,
} from "../utils/prospectStatus";
import { Button, Group, Row } from "./Apple";

type Props = {
  prospect: Prospect | null;
  user: CoraltUser | null | undefined;
  busy?: boolean;
  onClose: () => void;
  onToggleStatus: (p: Prospect) => void;
  onSend: (p: Prospect) => void;
  onDelete: (p: Prospect) => void;
  onOpenEnvois?: () => void;
};

export function ProspectDetailSheet({
  prospect,
  user,
  busy,
  onClose,
  onToggleStatus,
  onSend,
  onDelete,
  onOpenEnvois,
}: Props) {
  const insets = useSafeAreaInsets();
  const c = useColors();
  const showContacts = entreprisesShowContacts(user);
  const showMail = entreprisesShowMailActions(user);
  const canToggle = entreprisesCanToggleContactStatus(user);
  const p = prospect;
  const kind = p ? prospectStatusKind(p.statut) : "validate";
  const statusColor =
    kind === "sent"
      ? c.success
      : kind === "in_progress"
        ? c.warning
        : c.accent;

  const openMore = () => {
    if (!p) return;
    const buttons: {
      text: string;
      style?: "cancel" | "destructive" | "default";
      onPress?: () => void;
    }[] = [];
    if (onOpenEnvois) {
      buttons.push({ text: "Ouvrir Envois", onPress: onOpenEnvois });
    }
    buttons.push({
      text: "Supprimer",
      style: "destructive",
      onPress: () => onDelete(p),
    });
    buttons.push({ text: "Annuler", style: "cancel" });
    Alert.alert(p.entreprise || "Entreprise", undefined, buttons);
  };

  return (
    <Modal
      visible={Boolean(p)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { backgroundColor: c.bg }]}>
        <View style={[styles.grabber, { backgroundColor: c.separator }]} />
        <View style={styles.header}>
          <View style={{ flex: 1, gap: 6 }}>
            <Text
              style={[styles.headerTitle, { color: c.text }]}
              numberOfLines={2}
            >
              {p?.entreprise || "Entreprise"}
            </Text>
            {p ? (
              <View style={styles.statusLine}>
                <View style={[styles.dot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {prospectStatusLabel(p.statut)}
                </Text>
                {p.repondu === "yes" ? (
                  <Text style={{ color: c.success, fontSize: 13, fontWeight: "600" }}>
                    · Répondu
                  </Text>
                ) : null}
                {busy ? <ActivityIndicator color={c.accent} /> : null}
              </View>
            ) : null}
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[styles.closeBtn, { backgroundColor: c.searchBg }]}
          >
            <Text style={[styles.closeText, { color: c.accent }]}>Fermer</Text>
          </Pressable>
        </View>

        {!p ? null : (
          <>
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.body}
              keyboardShouldPersistTaps="handled"
            >
              {showContacts ? (
                <>
                  <Text style={[styles.section, { color: c.muted }]}>
                    Contact
                  </Text>
                  <Group>
                    <Row
                      label="Email"
                      value={p.email || "—"}
                      accentValue
                      onPress={
                        p.email
                          ? () => Linking.openURL(`mailto:${p.email}`)
                          : undefined
                      }
                    />
                    <Row
                      label="Téléphone"
                      value={p.numero || "—"}
                      accentValue
                      onPress={
                        p.numero
                          ? () => Linking.openURL(`tel:${p.numero}`)
                          : undefined
                      }
                    />
                    <Row label="Contact" value={p.contact || "—"} last />
                  </Group>
                </>
              ) : (
                <>
                  <Text style={[styles.section, { color: c.muted }]}>
                    Contact
                  </Text>
                  <Group>
                    <Row
                      label="Détails"
                      value="Disponibles dès le plan Avancé"
                      last
                    />
                  </Group>
                </>
              )}

              {(p.lien || p.notePerso || p.info) && (
                <>
                  <Text style={[styles.section, { color: c.muted }]}>
                    Infos
                  </Text>
                  <Group>
                    {p.lien ? (
                      <Row
                        label="Site"
                        value="Ouvrir"
                        accentValue
                        onPress={() => Linking.openURL(String(p.lien))}
                        last={!p.notePerso && !p.info}
                      />
                    ) : null}
                    {p.notePerso ? (
                      <Row
                        label="Note"
                        value={String(p.notePerso)}
                        last={!p.info}
                      />
                    ) : null}
                    {p.info ? (
                      <Row label="Info" value={String(p.info)} last />
                    ) : null}
                  </Group>
                </>
              )}

              <Text style={[styles.section, { color: c.muted }]}>
                Identité
              </Text>
              <Group>
                <Row label="Ville" value={p.ville || "—"} />
                <Row label="Adresse" value={p.adresse || "—"} />
                <Row label="Secteur" value={p.secteur || "—"} />
                <Row label="Taille" value={p.taille || "—"} last />
              </Group>

              {showMail ? (
                <>
                  <Text style={[styles.section, { color: c.muted }]}>Mail</Text>
                  <Group>
                    <Row
                      label="Objet"
                      value={p.mailSubject || "Non généré"}
                      last={!p.mailBody}
                    />
                    {p.mailBody ? (
                      <View
                        style={[
                          styles.mailBody,
                          { borderTopColor: c.border },
                        ]}
                      >
                        <Text
                          style={[styles.mailBodyText, { color: c.muted }]}
                          numberOfLines={10}
                        >
                          {p.mailBody}
                        </Text>
                      </View>
                    ) : null}
                  </Group>
                </>
              ) : null}
            </ScrollView>

            <View
              style={[
                styles.footer,
                {
                  borderTopColor: c.separator,
                  paddingBottom: insets.bottom + 12,
                  backgroundColor: c.bg,
                },
              ]}
            >
              {showMail ? (
                <Button
                  label="Envoyer la candidature"
                  disabled={busy}
                  loading={busy}
                  onPress={() => onSend(p)}
                />
              ) : null}
              {canToggle ? (
                <Button
                  label={
                    isSentStatut(p.statut)
                      ? "Remettre à contacter"
                      : "Marquer envoyé"
                  }
                  variant="gray"
                  disabled={busy}
                  onPress={() => onToggleStatus(p)}
                />
              ) : null}
              <Pressable onPress={openMore} hitSlop={8} style={styles.moreLink}>
                <Text style={{ color: c.accent, fontSize: 16, fontWeight: "600" }}>
                  Plus…
                </Text>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, paddingTop: 12 },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  statusLine: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: "600" },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: "center",
  },
  closeText: { fontSize: 16, fontWeight: "600" },
  scroll: { flex: 1 },
  body: { paddingBottom: 24 },
  section: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginHorizontal: 20,
    marginTop: 18,
    marginBottom: 8,
  },
  mailBody: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  mailBodyText: { fontSize: 15, lineHeight: 21 },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  moreLink: {
    alignItems: "center",
    paddingVertical: 10,
    minHeight: 44,
    justifyContent: "center",
  },
});
