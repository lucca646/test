import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Slider from "@react-native-community/slider";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as LocalAuthentication from "expo-local-authentication";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  tone?: "primary" | "ghost" | "danger" | "soft";
  disabled?: boolean;
}) {
  const bg =
    tone === "primary"
      ? "#34d399"
      : tone === "danger"
        ? "#ef4444"
        : tone === "soft"
          ? "rgba(255,255,255,0.12)"
          : "transparent";
  const color =
    tone === "ghost" ? "#6ee7b7" : tone === "soft" || tone === "danger" ? "#fff" : "#04140c";
  const border = tone === "ghost" ? "#34d39966" : "transparent";
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderColor: border,
          opacity: disabled ? 0.4 : pressed ? 0.8 : 1,
        },
      ]}
    >
      <Text style={[styles.btnText, { color }]}>{label}</Text>
    </Pressable>
  );
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("lab", {
    name: "Zone de test",
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 120, 250],
    lightColor: "#34d399",
    sound: "default",
  });
}

/** Zone de test UI + device (Expo Go). */
export default function DeviceLab() {
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraView>(null);

  const [query, setQuery] = useState("");
  const [slider, setSlider] = useState(0.42);
  const [toggle, setToggle] = useState(true);
  const [segment, setSegment] = useState<"A" | "B" | "C">("A");
  const [modalOpen, setModalOpen] = useState(false);

  const [bioMsg, setBioMsg] = useState("Diagnostic…");
  const [bioBusy, setBioBusy] = useState(false);

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [torch, setTorch] = useState(false);
  const [camMsg, setCamMsg] = useState("");

  const [notifMsg, setNotifMsg] = useState("Pas encore autorisé");
  const [notifBusy, setNotifBusy] = useState(false);

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

  const refreshBio = useCallback(async () => {
    try {
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = has
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      const types = has
        ? await LocalAuthentication.supportedAuthenticationTypesAsync()
        : [];
      const level = await LocalAuthentication.getEnrolledLevelAsync();
      const labels = types.map((t) =>
        t === FAKESECRET_o1p2q3r4s5t6u7v8w9x0
          ? "Face ID"
          : t === LocalAuthentication.AuthenticationType.FINGERPRINT
            ? "Touch ID"
            : "Iris",
      );
      const levelLabel =
        level === LocalAuthentication.SecurityLevel.BIOMETRIC_STRONG
          ? "fort"
          : level === LocalAuthentication.SecurityLevel.BIOMETRIC_WEAK
            ? "faible"
            : level === LocalAuthentication.SecurityLevel.SECRET
              ? "code appareil"
              : "aucun";
      setBioMsg(
        !has
          ? "Pas de capteur biométrique (simulateur ?)"
          : !enrolled
            ? `Capteur OK (${labels.join(", ") || "bio"}) mais rien d’enregistré dans Réglages → Face ID.`
            : `Prêt : ${labels.join(", ") || "biométrie"} · niveau ${levelLabel}`,
      );
    } catch (e) {
      setBioMsg(e instanceof Error ? e.message : "Erreur diagnostic biométrie");
    }
  }, []);

  const refreshNotif = useCallback(async () => {
    const { status, granted, canAskAgain } =
      await Notifications.getPermissionsAsync();
    setNotifMsg(
      granted
        ? `Notifications autorisées (${status})`
        : canAskAgain
          ? `Pas encore autorisées (${status})`
          : `Refusées (${status}) — ouvre Réglages`,
    );
  }, []);

  useEffect(() => {
    refreshBio();
    refreshNotif();
    ensureAndroidChannel().catch(() => undefined);
  }, [refreshBio, refreshNotif]);

  const runBio = useCallback(async () => {
    setBioBusy(true);
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const has = await LocalAuthentication.hasHardwareAsync();
      const enrolled = has
        ? await LocalAuthentication.isEnrolledAsync()
        : false;
      if (!has) {
        Alert.alert(
          "Face ID",
          "Aucun capteur biométrique. Sur simulateur, active Features → Face ID.",
        );
        return;
      }
      if (!enrolled) {
        Alert.alert(
          "Face ID non configuré",
          "Va dans Réglages iPhone → Face ID et code, puis réessaie.",
          [
            { text: "OK", style: "cancel" },
            {
              text: "Ouvrir Réglages",
              onPress: () => Linking.openSettings(),
            },
          ],
        );
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Test Face ID / Touch ID — Liquid Glass",
        cancelLabel: "Annuler",
        fallbackLabel: "Code appareil",
        disableDeviceFallback: false,
      });
      if (result.success) {
        setBioMsg("Authentifié ✓");
        Alert.alert("Face ID", "Succès — biométrie OK.");
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success,
        );
      } else {
        const why = result.error || "annulé";
        setBioMsg(`Échec : ${why}`);
        Alert.alert("Face ID", `Échec / annulé\n${why}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur biométrie";
      setBioMsg(msg);
      Alert.alert("Face ID", msg);
    } finally {
      setBioBusy(false);
      refreshBio();
    }
  }, [refreshBio]);

  const openCamera = useCallback(async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          "Caméra",
          "Permission refusée. Autorise la caméra pour Expo Go dans Réglages.",
          [
            { text: "OK", style: "cancel" },
            { text: "Réglages", onPress: () => Linking.openSettings() },
          ],
        );
        return;
      }
    }
    setTorch(false);
    setFacing("back");
    setCamMsg("");
    setCameraOpen(true);
  }, [permission, requestPermission]);

  const snapPhoto = useCallback(async () => {
    try {
      const photo = await cameraRef.current?.takePictureAsync({
        quality: 0.4,
        shutterSound: true,
        exif: false,
      });
      setCamMsg(
        photo?.uri
          ? `Photo OK (${Math.round((photo.width || 0) / 10) / 100}k px large)`
          : "Photo capturée",
      );
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur photo";
      setCamMsg(msg);
      Alert.alert("Caméra", msg);
    }
  }, []);

  const askNotifPermission = useCallback(async () => {
    setNotifBusy(true);
    try {
      await ensureAndroidChannel();
      const current = await Notifications.getPermissionsAsync();
      let final = current;
      if (!current.granted) {
        final = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: true,
            allowSound: true,
          },
        });
      }
      await refreshNotif();
      if (!final.granted) {
        Alert.alert(
          "Notifications",
          "Permission refusée. Active-les pour Expo Go dans Réglages → Notifications.",
          [
            { text: "OK", style: "cancel" },
            { text: "Réglages", onPress: () => Linking.openSettings() },
          ],
        );
      } else {
        Alert.alert("Notifications", "Autorisées ✓");
      }
    } finally {
      setNotifBusy(false);
    }
  }, [refreshNotif]);

  const sendNotif = useCallback(
    async (delaySec: number) => {
      setNotifBusy(true);
      try {
        await ensureAndroidChannel();
        const perms = await Notifications.getPermissionsAsync();
        if (!perms.granted) {
          await askNotifPermission();
          const again = await Notifications.getPermissionsAsync();
          if (!again.granted) return;
        }
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: delaySec ? "Rappel Liquid Glass" : "Liquid Glass",
            body: delaySec
              ? `Notification planifiée (+${delaySec}s)`
              : "Notification locale immédiate — zone de test Apps.",
            sound: true,
            data: { source: "device-lab" },
            ...(Platform.OS === "android" ? { channelId: "lab" } : {}),
          },
          trigger: delaySec
            ? {
                type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
                seconds: delaySec,
                // @ts-expect-error channelId android
                channelId: Platform.OS === "android" ? "lab" : undefined,
              }
            : null,
        });
        setNotifMsg(
          delaySec
            ? `Planifiée #${id.slice(0, 8)}… dans ${delaySec}s`
            : `Envoyée #${id.slice(0, 8)}… (regarde le centre de notifs)`,
        );
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (!delaySec) {
          Alert.alert(
            "Notification",
            "Envoyée. Si tu ne la vois pas : Réglages → Notifications → Expo Go → Autoriser.",
          );
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erreur notification";
        setNotifMsg(msg);
        Alert.alert("Notifications", msg);
      } finally {
        setNotifBusy(false);
      }
    },
    [askNotifPermission],
  );

  const copyDemo = useCallback(async () => {
    await Clipboard.setStringAsync(`Liquid Glass · slider=${slider.toFixed(2)}`);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Clipboard", "Texte copié.");
  }, [slider]);

  return (
    <View style={styles.wrap}>
      {/* Device features d’abord — plus visibles */}
      <Section title="Face ID / Touch ID">
        <Text style={styles.meta}>{bioMsg}</Text>
        <View style={styles.rowWrap}>
          <Btn
            label={bioBusy ? "…" : "Tester Face ID"}
            onPress={runBio}
            disabled={bioBusy}
          />
          <Btn label="Rescan" tone="soft" onPress={refreshBio} />
          <Btn
            label="Réglages"
            tone="ghost"
            onPress={() => Linking.openSettings()}
          />
        </View>
      </Section>

      <Section title="Caméra · Flash (torch)">
        <Text style={styles.meta}>
          {permission?.granted
            ? "Permission caméra OK — ouvre le viewer plein écran."
            : "Permission caméra requise (Expo Go)."}
        </Text>
        <View style={styles.rowWrap}>
          <Btn label="Ouvrir caméra" onPress={openCamera} />
          {!permission?.granted ? (
            <Btn
              label="Demander accès"
              tone="soft"
              onPress={async () => {
                const res = await requestPermission();
                if (!res.granted) Linking.openSettings();
              }}
            />
          ) : null}
        </View>
        <Text style={styles.hint}>
          Dans le viewer : Flash = torche LED (caméra arrière).
        </Text>
      </Section>

      <Section title="Notifications locales">
        <Text style={styles.meta}>{notifMsg}</Text>
        <View style={styles.rowWrap}>
          <Btn
            label={notifBusy ? "…" : "Autoriser"}
            onPress={askNotifPermission}
            disabled={notifBusy}
          />
          <Btn
            label="Maintenant"
            tone="soft"
            onPress={() => sendNotif(0)}
            disabled={notifBusy}
          />
          <Btn
            label="+5 s"
            tone="ghost"
            onPress={() => sendNotif(5)}
            disabled={notifBusy}
          />
          <Btn
            label="Réglages"
            tone="ghost"
            onPress={() => Linking.openSettings()}
          />
        </View>
      </Section>

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
              style={[styles.seg, segment === s ? styles.segOn : null]}
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

      {/* Caméra plein écran — hors ScrollView pour un preview fiable */}
      <Modal
        visible={cameraOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => {
          setTorch(false);
          setCameraOpen(false);
        }}
      >
        <View style={[styles.camRoot, { paddingTop: insets.top }]}>
          <View style={styles.camPreview}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFill}
              facing={facing}
              enableTorch={torch && facing === "back"}
              mode="picture"
            />
          </View>
          <Text style={styles.camStatus}>
            {facing === "back" ? "Arrière" : "Selfie"} · torche{" "}
            {torch ? "ON" : "OFF"}
            {camMsg ? ` · ${camMsg}` : ""}
          </Text>
          <View
            style={[
              styles.camControls,
              { paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            <Btn
              label="Fermer"
              tone="soft"
              onPress={() => {
                setTorch(false);
                setCameraOpen(false);
              }}
            />
            <Btn
              label={facing === "back" ? "Selfie" : "Arrière"}
              tone="ghost"
              onPress={() => {
                setTorch(false);
                setFacing((f) => (f === "back" ? "front" : "back"));
              }}
            />
            <Btn
              label={torch ? "Flash OFF" : "Flash ON"}
              tone={torch ? "danger" : "primary"}
              onPress={() => {
                if (facing === "front") {
                  Alert.alert(
                    "Flash",
                    "La torche LED marche sur la caméra arrière.",
                  );
                  setFacing("back");
                }
                setTorch((t) => !t);
              }}
            />
            <Btn label="Photo" onPress={snapPhoto} />
          </View>
        </View>
      </Modal>

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
  camRoot: {
    flex: 1,
    backgroundColor: "#000",
    paddingHorizontal: 14,
    gap: 10,
  },
  camPreview: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#111",
    marginTop: 8,
  },
  camStatus: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },
  camControls: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "center",
  },
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
