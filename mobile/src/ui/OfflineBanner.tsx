import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getIsOnline, subscribeConnectivity } from "../messages/api";
import { useColors } from "../theme";

/**
 * Bandeau discret affiché quand des requêtes échouent pour une raison
 * réseau (pas HTTP) — pas de lib NetInfo (dépendance native, casserait
 * l'OTA), juste un état dérivé des appels API.
 */
export default function OfflineBanner() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [online, setOnline] = useState(getIsOnline());

  useEffect(() => subscribeConnectivity(setOnline), []);

  if (online) return null;

  return (
    <View style={[styles.wrap, { top: insets.top + 4 }]} pointerEvents="none">
      <Text style={[styles.text, { backgroundColor: c.warning, color: c.bg }]}>
        Hors ligne — nouvelle tentative…
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: "700",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    overflow: "hidden",
  },
});
