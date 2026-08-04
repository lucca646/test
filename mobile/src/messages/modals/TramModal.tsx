import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getTram, type TramPayload } from "../api";
import { EmptyState } from "../../ui/Apple";
import { useColors } from "../../theme";

/** Avancement trame commerciale (PVMD-EA) — checklist n/6. */
export default function TramModal({
  visible,
  number,
  onClose,
}: {
  visible: boolean;
  number: string | null;
  onClose: () => void;
}) {
  const c = useColors();
  const [payload, setPayload] = useState<TramPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !number) return;
    setLoading(true);
    setError(null);
    getTram(number)
      .then(setPayload)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [visible, number]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <View style={[styles.header, { borderBottomColor: c.separator }]}>
          <Text style={[styles.headerTitle, { color: c.text }]}>
            Avancement trame {payload ? `· ${payload.doneCount}/${payload.totalSteps}` : ""}
          </Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={[styles.headerBtn, { color: c.accent }]}>Fermer</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={c.accent} style={{ marginTop: 40 }} />
        ) : error || !payload ? (
          <EmptyState title="Indisponible" subtitle={error || undefined} />
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {payload.progress.note ? (
              <Text style={[styles.note, { color: c.muted }]}>{payload.progress.note}</Text>
            ) : null}
            {payload.checklist.map((item) => (
              <View key={item.step} style={[styles.item, { borderBottomColor: c.separator }]}>
                <View
                  style={[
                    styles.check,
                    {
                      backgroundColor: item.done ? c.success : "transparent",
                      borderColor: item.done ? c.success : item.current ? c.accent : c.border,
                    },
                  ]}
                >
                  {item.done ? <Ionicons name="checkmark" size={14} color="#fff" /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.itemLabel,
                      { color: c.text, fontWeight: item.current ? "700" : "600" },
                    ]}
                  >
                    {item.label}
                    {item.current ? " · en cours" : ""}
                  </Text>
                  <Text style={[styles.itemInstruction, { color: c.muted }]}>{item.instruction}</Text>
                </View>
              </View>
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
  headerTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  headerBtn: { fontSize: 16 },
  list: { padding: 16, gap: 2 },
  note: { fontSize: 13, marginBottom: 12, fontStyle: "italic" },
  item: {
    flexDirection: "row",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 1,
  },
  itemLabel: { fontSize: 15, marginBottom: 2 },
  itemInstruction: { fontSize: 13, lineHeight: 18 },
});
