import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useColors } from "../theme";

/**
 * Surface "Liquid Glass" (façon iOS 26 — Control Center, barres de choix) :
 * verre dépoli (`BlurView`) + liseré de reflet en haut, au lieu d'un simple
 * fond opaque gris. Utilisé pour les zones de choix horizontales (Segmented,
 * chips SIM/étiquettes) plutôt que les fonds plats précédents.
 */
export function GlassSurface({
  children,
  style,
  radius = 9,
  intensity,
}: {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  /** Override manuel — sinon dérivé du mode clair/sombre. */
  intensity?: number;
}) {
  const c = useColors();
  const dark = c.statusBar === "light"; // statusBar "light" = contenu clair = fond sombre
  return (
    <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
      <BlurView
        intensity={intensity ?? (dark ? 42 : 62)}
        tint={dark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            borderRadius: radius,
            borderWidth: 1,
            borderColor: dark ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.65)",
            borderTopColor: dark ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.9)",
          },
        ]}
      />
      {children}
    </View>
  );
}
