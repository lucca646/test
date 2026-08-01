import { useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
} from "react-native";
import type { StickVector } from "./VirtualJoystick";

type Zone = { x: number; y: number; w: number; h: number };

type Props = {
  tint: string;
  onStick: (v: StickVector) => void;
  actionLabel?: string;
  onAction?: () => void;
  stickSize?: number;
};

function hit(z: Zone, pageX: number, pageY: number) {
  return (
    pageX >= z.x &&
    pageX <= z.x + z.w &&
    pageY >= z.y &&
    pageY <= z.y + z.h
  );
}

/**
 * Contrôles multi-touch : FEU à gauche, joystick à droite.
 * Un seul View parent lit tous les doigts (identifier) pour pouvoir
 * tirer tout en pilotant.
 */
export default function DualControls({
  tint,
  onStick,
  actionLabel,
  onAction,
  stickSize = 132,
}: Props) {
  const maxTravel = stickSize * 0.31;
  const stickZone = useRef<Zone>({ x: 0, y: 0, w: 0, h: 0 });
  const fireZone = useRef<Zone>({ x: 0, y: 0, w: 0, h: 0 });
  const stickRef = useRef<View>(null);
  const fireRef = useRef<View>(null);
  const knobRef = useRef<View>(null);
  const fireBtnRef = useRef<View>(null);

  const stickTouch = useRef<number | null>(null);
  const fireTouch = useRef<number | null>(null);
  const onStickRef = useRef(onStick);
  const onActionRef = useRef(onAction);
  onStickRef.current = onStick;
  onActionRef.current = onAction;

  const measure = () => {
    stickRef.current?.measureInWindow((x, y, w, h) => {
      stickZone.current = { x, y, w, h };
    });
    fireRef.current?.measureInWindow((x, y, w, h) => {
      fireZone.current = { x, y, w, h };
    });
  };

  const setKnob = (dx: number, dy: number) => {
    knobRef.current?.setNativeProps({
      style: { transform: [{ translateX: dx }, { translateY: dy }] },
    });
  };

  const setFirePressed = (pressed: boolean) => {
    fireBtnRef.current?.setNativeProps({
      style: { opacity: pressed ? 0.7 : 1, transform: [{ scale: pressed ? 0.94 : 1 }] },
    });
  };

  const applyStick = (pageX: number, pageY: number) => {
    const z = stickZone.current;
    const cx = z.x + z.w / 2;
    const cy = z.y + z.h / 2;
    let dx = pageX - cx;
    let dy = pageY - cy;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > maxTravel) {
      dx = (dx / dist) * maxTravel;
      dy = (dy / dist) * maxTravel;
    }
    setKnob(dx, dy);
    onStickRef.current({
      x: Math.max(-1, Math.min(1, dx / maxTravel)),
      y: Math.max(-1, Math.min(1, dy / maxTravel)),
    });
  };

  const releaseStick = () => {
    stickTouch.current = null;
    setKnob(0, 0);
    onStickRef.current({ x: 0, y: 0 });
  };

  const releaseFire = () => {
    fireTouch.current = null;
    setFirePressed(false);
  };

  const onTouchStart = (e: GestureResponderEvent) => {
    measure();
    for (const t of e.nativeEvent.changedTouches) {
      const id = t.identifier;
      const { pageX, pageY } = t;
      if (
        stickTouch.current == null &&
        hit(stickZone.current, pageX, pageY)
      ) {
        stickTouch.current = id;
        applyStick(pageX, pageY);
        continue;
      }
      if (
        onActionRef.current &&
        fireTouch.current == null &&
        hit(fireZone.current, pageX, pageY)
      ) {
        fireTouch.current = id;
        setFirePressed(true);
        onActionRef.current();
      }
    }
  };

  const onTouchMove = (e: GestureResponderEvent) => {
    for (const t of e.nativeEvent.changedTouches) {
      if (t.identifier === stickTouch.current) {
        applyStick(t.pageX, t.pageY);
      }
    }
  };

  const onTouchEnd = (e: GestureResponderEvent) => {
    for (const t of e.nativeEvent.changedTouches) {
      if (t.identifier === stickTouch.current) releaseStick();
      if (t.identifier === fireTouch.current) releaseFire();
    }
  };

  const radius = stickSize / 2;
  const hasFire = Boolean(actionLabel && onAction);

  return (
    <View
      style={styles.row}
      onLayout={measure}
      // Multi-touch natif : tous les doigts (enfants en pointerEvents=none)
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onTouchCancel={onTouchEnd}
    >
      {/* FEU à gauche */}
      <View
        ref={fireRef}
        collapsable={false}
        onLayout={measure}
        style={styles.fireSlot}
        pointerEvents="none"
      >
        {hasFire ? (
          <View
            ref={fireBtnRef}
            collapsable={false}
            style={[styles.action, { backgroundColor: tint }]}
          >
            <Text style={styles.actionText}>{actionLabel}</Text>
          </View>
        ) : (
          <View style={styles.actionSpacer} />
        )}
      </View>

      {/* Joystick à droite */}
      <View
        ref={stickRef}
        collapsable={false}
        onLayout={measure}
        pointerEvents="none"
        style={[
          styles.base,
          {
            width: stickSize,
            height: stickSize,
            borderRadius: radius,
            borderColor: `${tint}99`,
            backgroundColor: `${tint}22`,
          },
        ]}
      >
        <View style={[styles.ring, { borderColor: `${tint}55` }]} />
        <View
          ref={knobRef}
          collapsable={false}
          style={[
            styles.knob,
            {
              width: stickSize * 0.42,
              height: stickSize * 0.42,
              borderRadius: stickSize * 0.21,
              marginLeft: -stickSize * 0.21,
              marginTop: -stickSize * 0.21,
              backgroundColor: tint,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    minHeight: 140,
  },
  fireSlot: {
    width: 88,
    height: 88,
    alignItems: "center",
    justifyContent: "center",
  },
  action: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  actionSpacer: { width: 88, height: 88 },
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
