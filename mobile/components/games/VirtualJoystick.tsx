import { useMemo, useRef } from "react";
import {
  PanResponder,
  StyleSheet,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from "react-native";

export type StickVector = { x: number; y: number };

type Props = {
  size?: number;
  onChange: (v: StickVector) => void;
  /** Couleur d’accent du pad */
  tint?: string;
};

/**
 * Joystick virtuel (PanResponder) — compatible Expo Go.
 * Vecteur normalisé ∈ [-1, 1] sur x/y.
 */
export default function VirtualJoystick({
  size = 132,
  onChange,
  tint = "#0a84ff",
}: Props) {
  const radius = size / 2;
  const maxTravel = radius * 0.62;
  const origin = useRef({ x: radius, y: radius });
  const knobView = useRef<View>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setKnob = (dx: number, dy: number) => {
    knobView.current?.setNativeProps({
      style: {
        transform: [{ translateX: dx }, { translateY: dy }],
      },
    });
  };

  const emit = (dx: number, dy: number) => {
    onChangeRef.current({
      x: Math.max(-1, Math.min(1, dx / maxTravel)),
      y: Math.max(-1, Math.min(1, dy / maxTravel)),
    });
  };

  const fromEvent = (e: GestureResponderEvent) => {
    const { locationX, locationY } = e.nativeEvent;
    let dx = locationX - origin.current.x;
    let dy = locationY - origin.current.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > maxTravel) {
      dx = (dx / dist) * maxTravel;
      dy = (dy / dist) * maxTravel;
    }
    setKnob(dx, dy);
    emit(dx, dy);
  };

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: fromEvent,
        onPanResponderMove: fromEvent,
        onPanResponderRelease: () => {
          setKnob(0, 0);
          onChangeRef.current({ x: 0, y: 0 });
        },
        onPanResponderTerminate: () => {
          setKnob(0, 0);
          onChangeRef.current({ x: 0, y: 0 });
        },
      }),
    // maxTravel dérive de size ; recreate si size change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    origin.current = { x: width / 2, y: height / 2 };
  };

  return (
    <View
      onLayout={onLayout}
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
      {...pan.panHandlers}
    >
      <View style={[styles.ring, { borderColor: `${tint}55` }]} />
      <View
        ref={knobView}
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
