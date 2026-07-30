import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as LocalAuthentication from "expo-local-authentication";
import { CameraView, useCameraPermissions } from "expo-camera";

const ROWS = [
  { id: "1", name: "Liquid Glass", cat: "UI", ver: "1.0" },
  { id: "2", name: "NativeTabs", cat: "Nav", ver: "6.0" },
  { id: "3", name: "Joystick Lab", cat: "Games", ver: "0.3" },
  { id: "4", name: "Live Activity", cat: "System", ver: "0.4" },
  { id: "5", name: "Face ID Gate", cat: "Auth", ver: "1.2" },
  { id: "6", name: "Camera Flash", cat: "Media", ver: "54" },
];

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Btn({
  label,
  onPress,
  tone = "primary",
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "ghost" | "danger" | "soft";
}) {
  const bg =
    tone === "primary"
      ? "#34d399"
      : tone === "danger"
        ? "#ef4444"
        : tone === "soft"
          ? "rgba(255,255,255,0.12)"
          : "transparent";
  const color = tone === "ghost" ? "#6ee7b7" : tone === "soft" ? "#fff" : "#04140c";
  const border = tone === "ghost" ? "#34d39966" : "transparent";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, borderColor: border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

/** Zone de test UI + device (Expo Go). */
export default function DeviceLab() {
  const [query, setQuery] = useState("");
  const [slider, setSlider] = useState(0.42);
  const [toggle, setToggle] = useState(true);
  const [segment, setSegment] = useState<"A" | "B" | "C">("A");
  const [modalOpen, setModalOpen] = useState(false);
  const [bioMsg, setBioMsg] = useState("Pas encore testé");
  const [bioOk, setBioOk] = useState<boolean | null>(null);
  const [clipMsg, setClipMsg] = useState("");
  const [cameraOn, setCameraOn] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ROWS;
    return ROWS.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.cat.toLowerCase().includes(q) ||
        r.ver.includes(q),
    );
  }, [query]);

  useEffect(() => {
    let alive = true;
    (async () => {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = has
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      const types = has
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];
      const labels = types.map((t) =>
        t === LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION
          ? "Face ID"
          : t === LocalAuthentication.AuthenticationType.FINGERPRINT
            ? "Touch ID"
            : "Iris",
      );
      if (!alive) return;
      setBioMsg(
        !has
          ? "Pas de biométrie sur cet appareil"
          : !enrolled
            ? "Matériel OK, aucune empreinte / Face ID enregistré"
            : `Dispo : ${labels.join(", ") || "biométrie"}`,
      );
    })();
    return () => {
      alive = false;
    };
  }, []);

  const runBio = useCallback(async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Test Face ID / Touch ID",
        cancelLabel: "Annuler",
        disableDeviceFallback: false,
      });
      setBioOk(result.success);
      setBioMsg(
        result.success
          ? "Authentifié ✓"
          : `Échec / annulé${result.error ? ` (${result.error})` : ""}`,
      );
    } catch (e) {
      setBioOk(false);
      setBioMsg(e instanceof Error ? e.message : "Erreur biométrie");
    }
  }, []);

  const copyDemo = useCallback(async () => {
    await Clipboard.setStringAsync(`Liquid Glass · slider=${slider.toFixed(2)}`);
    setClipMsg("Copié dans le presse-papiers");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => setClipMsg(""), 1800);
  }, [slider]);

  return (
    <View style={styles.wrap}>
      <Section title="Barre de recherche">
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Filtrer le tableau…"
            placeholderTextColor="rgba(255,255,255,0.35)"
            style={styles.searchInput}
            autoCorrect={false}
            clearButtonMode="while-editing"
          />
        </View>
      </Section>

      <Section title="Tableau">
        <View style={styles.table}>
          <View style={[styles.tr, styles.thead]}>
            <Text style={[styles.th, styles.colName]}>Nom</Text>
            <Text style={[styles.th, styles.colCat]}>Cat</Text>
            <Text style={[styles.th, styles.colVer]}>Ver</Text>
          </View>
          {filtered.map((r, i) => (
            <View
              key={r.id}
              style={[styles.tr, i % 2 === 0 ? styles.trAlt : null]}
            >
              <Text style={[styles.td, styles.colName]} numberOfLines={1}>
                {r.name}
              </Text>
              <Text style={[styles.td, styles.colCat]}>{r.cat}</Text>
              <Text style={[styles.td, styles.colVer]}>{r.ver}</Text>
            </View>
          ))}
          {filtered.length === 0 ? (
            <Text style={styles.empty}>Aucun résultat</Text>
          ) : null}
        </View>
      </Section>

      <Section title="Boutons + haptics">
        <View style={styles.rowWrap}>
          <Btn
            label="Primary"
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          />
          <Btn
            label="Ghost"
            tone="ghost"
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid)
            }
          />
          <Btn
            label="Soft"
            tone="soft"
            onPress={() =>
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            }
          />
          <Btn
            label="Danger"
            tone="danger"
            onPress={() =>
              Alert.alert("Danger", "Juste un Alert de test.", [
                { text: "OK", style: "cancel" },
              ])
            }
          />
          <Btn label="Modal" tone="soft" onPress={() => setModalOpen(true)} />
          <Btn label="Copier" tone="ghost" onPress={copyDemo} />
        </View>
        {clipMsg ? <Text style={styles.hint}>{clipMsg}</Text> : null}
      </Section>

      <Section title="Slider · Switch · Segments">
        <Text style={styles.meta}>Valeur {slider.toFixed(2)}</Text>
        <Slider
          style={styles.slider}
          minimumValue={0}
          maximumValue={1}
          value={slider}
          onValueChange={setSlider}
          minimumTrackTintColor="#34d399"
          maximumTrackTintColor="rgba(255,255,255,0.2)"
          thumbTintColor="#6ee7b7"
        />
        <View style={styles.switchRow}>
          <Text style={styles.meta}>Toggle {toggle ? "ON" : "OFF"}</Text>
          <Switch
            value={toggle}
            onValueChange={(v) => {
              setToggle(v);
              Haptics.selectionAsync();
            }}
            trackColor={{ false: "#333", true: "#059669" }}
            thumbColor="#fff"
          />
        </View>
        <View style={styles.segments}>
          {(["A", "B", "C"] as const).map((s) => (
            <Pressable
              key={s}
              onPress={() => {
                setSegment(s);
                Haptics.selectionAsync();
              }}
              style={[
                styles.seg,
                segment === s ? styles.segOn : null,
              ]}
            >
              <Text
                style={[
                  styles.segText,
                  segment === s ? styles.segTextOn : null,
                ]}
              >
                Segment {s}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${slider * 100}%` }]} />
        </View>
        <ActivityIndicator color="#34d399" style={{ marginTop: 10 }} />
      </Section>

      <Section title="Face ID / Touch ID">
        <Text style={styles.meta}>{bioMsg}</Text>
        {bioOk != null ? (
          <Text style={[styles.meta, { color: bioOk ? "#6ee7b7" : "#f87171" }]}>
            Dernier essai : {bioOk ? "OK" : "KO"}
          </Text>
        ) : null}
        <View style={styles.rowWrap}>
          <Btn label="Authentifier" onPress={runBio} />
        </View>
      </Section>

      <Section title="Caméra · Flash">
        {!permission?.granted ? (
          <View style={{ gap: 10 }}>
            <Text style={styles.meta}>
              Permission caméra {permission?.canAskAgain === false ? "refusée" : "requise"}
            </Text>
            <Btn label="Autoriser la caméra" onPress={requestPermission} />
          </View>
        ) : (
          <>
            <View style={styles.rowWrap}>
              <Btn
                label={cameraOn ? "Stop caméra" : "Start caméra"}
                onPress={() => {
                  setCameraOn((v) => !v);
                  if (cameraOn) setTorch(false);
                }}
              />
              <Btn
                label={facing === "back" ? "Selfie" : "Arrière"}
                tone="soft"
                onPress={() =>
                  setFacing((f) => (f === "back" ? "front" : "back"))
                }
              />
              <Btn
                label={torch ? "Flash OFF" : "Flash ON"}
                tone={torch ? "danger" : "ghost"}
                onPress={() => {
                  if (facing === "front") {
                    Alert.alert("Flash", "Le torch mode marche surtout à l’arrière.");
                    return;
                  }
                  setTorch((t) => !t);
                }}
              />
            </View>
            {cameraOn ? (
              <View style={styles.cameraBox}>
                <CameraView
                  style={StyleSheet.absoluteFill}
                  facing={facing}
                  enableTorch={torch && facing === "back"}
                />
                <View style={styles.cameraBadge}>
                  <Text style={styles.cameraBadgeText}>
                    {facing} · flash {torch ? "on" : "off"} · {Platform.OS}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.hint}>Caméra arrêtée — appuie sur Start.</Text>
            )}
          </>
        )}
      </Section>

      <Modal
        visible={modalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Modal de test</Text>
            <Text style={styles.meta}>
              Overlay, animation fade, bouton de fermeture.
            </Text>
            <Btn label="Fermer" onPress={() => setModalOpen(false)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 14 },
  section: {
    borderRadius: 20,
    padding: 16,
    backgroundColor: "rgba(28,28,30,0.82)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    gap: 10,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  searchIcon: { color: "rgba(255,255,255,0.45)", fontSize: 16 },
  searchInput: { flex: 1, color: "#fff", fontSize: 16 },
  table: {
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tr: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    alignItems: "center",
  },
  thead: { backgroundColor: "rgba(52,211,153,0.18)" },
  trAlt: { backgroundColor: "rgba(255,255,255,0.04)" },
  th: { color: "#a7f3d0", fontWeight: "700", fontSize: 12 },
  td: { color: "rgba(255,255,255,0.88)", fontSize: 13 },
  colName: { flex: 1.4 },
  colCat: { flex: 0.8 },
  colVer: { flex: 0.5, textAlign: "right" },
  empty: {
    color: "rgba(255,255,255,0.5)",
    padding: 14,
    textAlign: "center",
  },
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  btn: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  btnText: { fontWeight: "800", fontSize: 13 },
  meta: { color: "rgba(255,255,255,0.72)", fontSize: 13, lineHeight: 18 },
  hint: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  slider: { width: "100%", height: 36 },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  segments: {
    flexDirection: "row",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 12,
    padding: 3,
    gap: 2,
  },
  seg: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  segOn: { backgroundColor: "#34d399" },
  segText: { color: "rgba(255,255,255,0.65)", fontWeight: "700", fontSize: 12 },
  segTextOn: { color: "#04140c" },
  progressTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#34d399",
    borderRadius: 999,
  },
  cameraBox: {
    height: 220,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#000",
    marginTop: 4,
  },
  cameraBadge: {
    position: "absolute",
    left: 10,
    bottom: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  cameraBadgeText: { color: "#fff", fontSize: 11, fontWeight: "600" },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 20,
    padding: 20,
    gap: 12,
    backgroundColor: "#1c1c1e",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
});
