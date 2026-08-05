import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useColors } from "../theme";

/**
 * Surface "Liquid Glass" — exactement le même matériau natif que la barre
 * d'onglets (`NativeTabs` → `blurEffect={c.tabBlur}`, un vrai `UIBlurEffect`
 * `.systemMaterial` iOS), pas un simple fond semi-transparent "light/dark".
 * Utilisé pour les zones de choix horizontales (Segmented, chips SIM /
 * étiquettes) afin qu'elles aient le même rendu verre que la navbar.
 */
export function GlassSurface({
  children,
  style,
  radius = 9,
  intensity = 100,
}: {
  children?: ReactNode;
  style?: ViewStyle | ViewStyle[];
  radius?: number;
  /** 1–100, comme sur la navbar on reste à pleine intensité par défaut. */
  intensity?: number;
}) {
  const c = useColors();
  const dark = c.statusBar === "light"; // statusBar "light" = contenu clair = fond sombre
  return (
    <View style={[{ borderRadius: radius, overflow: "hidden" }, style]}>
      <BlurView
        intensity={intensity}
        tint={c.tabBlur}
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
