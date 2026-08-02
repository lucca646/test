import { useRef, useState } from "react";
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/**
 * Viseur BeReal-like — déclencheur blanc central (l’onglet UITabBar
 * reste taille système ; le gros bouton blanc est dans l’écran).
 */
export default function CameraTab() {
  const insets = useSafeAreaInsets();
  const camRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<"back" | "front">("back");
  const [shot, setShot] = useState<string | null>(null);

  if (!permission) {
    return <View style={styles.root} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.root, styles.center, { paddingTop: insets.top }]}>
        <StatusBar style="light" />
        <Text style={styles.title}>Caméra</Text>
        <Text style={styles.body}>
          Autorise l’accès pour le mode BeReal.
        </Text>
        <Pressable style={styles.allow} onPress={() => void requestPermission()}>
          <Text style={styles.allowText}>Autoriser</Text>
        </Pressable>
      </View>
    );
  }

  const take = async () => {
    const photo = await camRef.current?.takePictureAsync({
      quality: 0.85,
      skipProcessing: true,
    });
    if (photo?.uri) setShot(photo.uri);
  };

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      {shot ? (
        <Image source={{ uri: shot }} style={StyleSheet.absoluteFill} />
      ) : (
        <CameraView ref={camRef} style={StyleSheet.absoluteFill} facing={facing} />
      )}

      <View style={[styles.top, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.kicker}>BEREAL · CAM</Text>
        <Pressable
          onPress={() => setFacing((f) => (f === "back" ? "front" : "back"))}
          style={styles.flip}
        >
          <Text style={styles.flipText}>Retourner</Text>
        </Pressable>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 28 }]}>
        {shot ? (
          <Pressable style={styles.secondary} onPress={() => setShot(null)}>
            <Text style={styles.secondaryText}>Reprendre</Text>
          </Pressable>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Prendre une photo"
            onPress={() => void take()}
            style={({ pressed }) => [
              styles.shutter,
              pressed && styles.shutterPressed,
            ]}
          >
            <View style={styles.shutterInner} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#000" },
  center: { alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  title: { color: "#fff", fontSize: 28, fontWeight: "800" },
  body: { color: "rgba(255,255,255,0.7)", textAlign: "center", lineHeight: 22 },
  allow: {
    marginTop: 8,
    backgroundColor: "#fff",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 999,
  },
  allowText: { color: "#111", fontWeight: "800" },
  top: {
    position: "absolute",
    left: 16,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  kicker: {
    color: "rgba(255,255,255,0.85)",
    fontWeight: "800",
    letterSpacing: 1.2,
    fontSize: 11,
  },
  flip: {
    backgroundColor: "rgba(0,0,0,0.35)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  flipText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
  },
  shutter: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.55)",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
  },
  shutterPressed: { transform: [{ scale: 0.96 }], opacity: 0.92 },
  shutterInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#111",
  },
  secondary: {
    backgroundColor: "rgba(255,255,255,0.92)",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 999,
  },
  secondaryText: { color: "#111", fontWeight: "800" },
});
