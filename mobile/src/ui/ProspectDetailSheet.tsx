import {
  ActivityIndicator,
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
import { Button, Group, Row, StatusPill } from "./Apple";

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
  const kind = p ? prospectStatusKind(p.statut) : "contact";

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
          <Text
            style={[styles.headerTitle, { color: c.text }]}
            numberOfLines={2}
          >
            {p?.entreprise || "Entreprise"}
          </Text>
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
              <View style={styles.badgeRow}>
                <StatusPill
                  kind={kind}
                  label={prospectStatusLabel(p.statut)}
                />
                {p.repondu === "yes" ? (
                  <StatusPill kind="sent" label="Répondu" />
                ) : null}
                {busy ? <ActivityIndicator color={c.accent} /> : null}
              </View>

              <Group>
                <Row label="Ville" value={p.ville || "—"} />
                <Row label="Adresse" value={p.adresse || "—"} />
                <Row label="Secteur" value={p.secteur || "—"} />
                <Row label="Taille" value={p.taille || "—"} last />
              </Group>

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

              {p.lien || p.notePerso || p.info ? (
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
              ) : null}

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
                          numberOfLines={12}
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
                      ? "Marquer à contacter"
                      : "Marquer envoyé"
                  }
                  variant="gray"
                  disabled={busy}
                  onPress={() => onToggleStatus(p)}
                />
              ) : null}
              {showMail && onOpenEnvois ? (
                <Button
                  label="Ouvrir Envois"
                  variant="tinted"
                  disabled={busy}
                  onPress={onOpenEnvois}
                />
              ) : null}
              <View style={{ marginTop: 8 }}>
                <Button
                  label="Supprimer"
                  variant="destructive"
                  disabled={busy}
                  onPress={() => onDelete(p)}
                />
              </View>
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
    flex: 1,
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: -0.6,
  },
  closeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: "center",
  },
  closeText: { fontSize: 16, fontWeight: "600" },
  scroll: { flex: 1 },
  body: { paddingBottom: 24, gap: 4 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
    flexWrap: "wrap",
  },
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
  mailBodyText: {
    fontSize: 15,
    lineHeight: 21,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
