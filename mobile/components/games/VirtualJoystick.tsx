import { useRef } from "react";
import { StyleSheet, View } from "react-native";

export type StickVector = { x: number; y: number };

type Props = {
  size?: number;
  tint?: string;
};

/** Visuel seul — le tracking est dans DualControls (multi-touch). */
export default function VirtualJoystick({
  size = 132,
  tint = "#0a84ff",
}: Props) {
  const radius = size / 2;
  return (
    <View
      pointerEvents="none"
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius,
          borderColor: `${tint}99`,
          backgroundColor: `${tint}22`,
        },
      ]}
    >
      <View style={[styles.ring, { borderColor: `${tint}55` }]} />
      <View
        style={[
          styles.knob,
          {
            width: size * 0.42,
            height: size * 0.42,
            borderRadius: size * 0.21,
            marginLeft: -size * 0.21,
            marginTop: -size * 0.21,
            backgroundColor: tint,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
  ring: {
    ...StyleSheet.absoluteFillObject,
    margin: 18,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  knob: {
    position: "absolute",
    left: "50%",
    top: "50%",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
