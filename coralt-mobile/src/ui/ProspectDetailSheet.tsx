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
import { colors } from "../theme";
import {
  entreprisesCanToggleContactStatus,
  entreprisesShowContacts,
  entreprisesShowMailActions,
  type CoraltUser,
} from "../utils/planAccess";
import {
  isSentStatut,
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
  const showContacts = entreprisesShowContacts(user);
  const showMail = entreprisesShowMailActions(user);
  const canToggle = entreprisesCanToggleContactStatus(user);
  const p = prospect;

  return (
    <Modal
      visible={Boolean(p)}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.sheet, { paddingTop: 12, paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.grabber} />
        <View style={styles.header}>
          <Text style={styles.headerTitle} numberOfLines={2}>
            {p?.entreprise || "Entreprise"}
          </Text>
          <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
            <Text style={styles.closeText}>Fermer</Text>
          </Pressable>
        </View>

        {!p ? null : (
          <ScrollView
            contentContainerStyle={styles.body}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {prospectStatusLabel(p.statut)}
                </Text>
              </View>
              {p.repondu === "yes" ? (
                <View style={[styles.badge, styles.badgeOk]}>
                  <Text style={[styles.badgeText, { color: colors.success }]}>
                    Répondu
                  </Text>
                </View>
              ) : null}
              {busy ? <ActivityIndicator color={colors.accent} /> : null}
            </View>

            <Group>
              <Row label="Ville" value={p.ville || "—"} />
              <Row label="Adresse" value={p.adresse || "—"} />
              <Row label="Secteur" value={p.secteur || "—"} />
              <Row label="Taille" value={p.taille || "—"} last />
            </Group>

            {showContacts ? (
              <>
                <Text style={styles.section}>Contact</Text>
                <Group>
                  <Row
                    label="Email"
                    value={p.email || "—"}
                    onPress={
                      p.email
                        ? () => Linking.openURL(`mailto:${p.email}`)
                        : undefined
                    }
                  />
                  <Row
                    label="Téléphone"
                    value={p.numero || "—"}
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
                <Text style={styles.section}>Contact</Text>
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
                <Text style={styles.section}>Infos</Text>
                <Group>
                  {p.lien ? (
                    <Row
                      label="Site"
                      value="Ouvrir"
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
                <Text style={styles.section}>Mail</Text>
                <Group>
                  <Row
                    label="Objet"
                    value={p.mailSubject || "Non généré"}
                    last={!p.mailBody}
                  />
                  {p.mailBody ? (
                    <View style={styles.mailBody}>
                      <Text style={styles.mailBodyText} numberOfLines={12}>
                        {p.mailBody}
                      </Text>
                    </View>
                  ) : null}
                </Group>
              </>
            ) : null}

            <View style={styles.actions}>
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
              {showMail ? (
                <>
                  <Button
                    label="Envoyer la candidature"
                    disabled={busy}
                    loading={busy}
                    onPress={() => onSend(p)}
                  />
                  {onOpenEnvois ? (
                    <Button
                      label="Ouvrir Envois"
                      variant="tinted"
                      disabled={busy}
                      onPress={onOpenEnvois}
                    />
                  ) : null}
                </>
              ) : null}
              <Button
                label="Supprimer"
                variant="destructive"
                disabled={busy}
                onPress={() => onDelete(p)}
              />
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheet: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: "rgba(235,235,245,0.3)",
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
    color: colors.text,
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  closeBtn: { paddingTop: 4 },
  closeText: { color: colors.accent, fontSize: 17, fontWeight: "600" },
  body: { paddingBottom: 32, gap: 4 },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "rgba(10,132,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeOk: { backgroundColor: "rgba(48,209,88,0.16)" },
  badgeText: { color: colors.accent, fontSize: 12, fontWeight: "700" },
  section: {
    color: colors.muted,
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
    borderTopColor: colors.border,
  },
  mailBodyText: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 21,
  },
  actions: {
    marginTop: 24,
    marginHorizontal: 16,
    gap: 10,
  },
});
