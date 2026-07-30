import { useEffect, useMemo, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  clamp,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

export type DockTab = {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconActive?: keyof typeof Ionicons.glyphMap;
};

type Props = {
  tabs: DockTab[];
  activeId: string;
  onChange: (id: string) => void;
  style?: StyleProp<ViewStyle>;
};

const ACTIVE = "#0a84ff";
const SPRING = { damping: 18, stiffness: 220, mass: 0.7 };

/**
 * Dock Liquid Glass — look validé porté en Expo (Expo Go, sans App Store).
 * Repos : pastille inset. Drag : plus grande + plus transparente, X only.
 */
export default function LiquidGlassDock({
  tabs,
  activeId,
  onChange,
  style,
}: Props) {
  const insets = useSafeAreaInsets();
  const { width: winW } = useWindowDimensions();
  const count = Math.max(tabs.length, 1);

  const sidePad = 14;
  const pillW = Math.min(winW - sidePad * 2, 544);
  const pillH = 64;
  const hPad = 6;
  const slot = (pillW - hPad * 2) / count;

  const restInset = 8;
  const dragOverflow = 4.5;
  const restH = pillH - restInset * 2;
  const dragH = pillH + dragOverflow * 2;

  const activeIndex = useMemo(() => {
    const i = tabs.findIndex((t) => t.id === activeId);
    return i < 0 ? 0 : i;
  }, [tabs, activeId]);

  const index = useSharedValue(activeIndex);
  const pressed = useSharedValue(0);
  const morphSx = useSharedValue(1);
  const morphSy = useSharedValue(1);
  const morphSkew = useSharedValue(0);

  const [highlight, setHighlight] = useState(activeIndex);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    if (dragging) return;
    index.value = withSpring(activeIndex, SPRING);
    setHighlight(activeIndex);
  }, [activeIndex, dragging]);

  const setHighlightJS = (i: number) => setHighlight(i);
  const setDraggingJS = (v: boolean) => setDragging(v);
  const commit = (i: number) => {
    const tab = tabs[i];
    if (tab) onChange(tab.id);
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      const x = clamp(e.x / slot - 0.5, 0, count - 1);
      pressed.value = 1;
      index.value = x;
      morphSx.value = 1.04;
      morphSy.value = 1.04;
      morphSkew.value = 0;
      runOnJS(setDraggingJS)(true);
      runOnJS(setHighlightJS)(Math.round(x));
    })
    .onUpdate((e) => {
      const x = clamp(e.x / slot - 0.5, 0, count - 1);
      index.value = x;
      const v = clamp(e.velocityX / 1200, -1.8, 1.8);
      const stretch = clamp(Math.abs(v) * 0.08, 0, 0.1);
      const s = clamp(1 + stretch * 0.35, 0.96, 1.08);
      morphSx.value = s;
      morphSy.value = s;
      morphSkew.value = clamp(v * 2.2, -5, 5);
      runOnJS(setHighlightJS)(Math.round(x));
    })
    .onEnd(() => {
      const i = clamp(Math.round(index.value), 0, count - 1);
      index.value = withSpring(i, SPRING);
      morphSx.value = withSpring(1, SPRING);
      morphSy.value = withSpring(1, SPRING);
      morphSkew.value = withSpring(0, SPRING);
      pressed.value = 0;
      runOnJS(setDraggingJS)(false);
      runOnJS(setHighlightJS)(i);
      runOnJS(commit)(i);
    })
    .onFinalize(() => {
      pressed.value = 0;
      runOnJS(setDraggingJS)(false);
      morphSx.value = withSpring(1, SPRING);
      morphSy.value = withSpring(1, SPRING);
      morphSkew.value = withSpring(0, SPRING);
    });

  const bubbleStyle = useAnimatedStyle(() => {
    const isDrag = pressed.value > 0.5;
    const h = isDrag ? dragH : restH;
    const top = isDrag ? -dragOverflow : restInset;
    return {
      position: "absolute" as const,
      left: hPad + index.value * slot,
      top,
      width: slot,
      height: h,
      borderRadius: 999,
      backgroundColor: isDrag
        ? "rgba(255,255,255,0.045)"
        : "rgba(255,255,255,0.1)",
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: isDrag
        ? "rgba(255,255,255,0.45)"
        : "rgba(255,255,255,0.28)",
      // ombre type glass-thumb au drag
      shadowColor: "#fff",
      shadowOpacity: isDrag ? 0.35 : 0.15,
      shadowRadius: isDrag ? 6 : 2,
      shadowOffset: { width: 0, height: 0 },
      transform: [
        { scaleX: morphSx.value },
        { scaleY: morphSy.value },
        { skewX: `${morphSkew.value}deg` },
      ],
    };
  });

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.dock,
        {
          paddingBottom: Math.max(insets.bottom, 10) + 4,
          paddingHorizontal: sidePad,
        },
        style,
      ]}
    >
      <GestureDetector gesture={pan}>
        <View style={[styles.pillWrap, { width: pillW, height: pillH }]}>
          {/* Blur clipé ; pastille peut déborder (overflow visible sur le wrap) */}
          <View style={styles.pillClip}>
            <BlurView intensity={52} tint="dark" style={StyleSheet.absoluteFill} />
            <View style={styles.pillShade} />
          </View>

          <Animated.View pointerEvents="none" style={bubbleStyle} />

          <View style={styles.row} pointerEvents="box-none">
            {tabs.map((tab, i) => {
              const on = i === highlight;
              const name =
                on && tab.iconActive != null ? tab.iconActive : tab.icon;
              return (
                <Pressable
                  key={tab.id}
                  style={styles.item}
                  onPress={() => {
                    index.value = withSpring(i, SPRING);
                    setHighlight(i);
                    onChange(tab.id);
                  }}
                >
                  <Ionicons
                    name={name}
                    size={22}
                    color={on ? ACTIVE : "rgba(255,255,255,0.92)"}
                  />
                  <Text
                    numberOfLines={1}
                    style={[styles.label, on && styles.labelActive]}
                  >
                    {tab.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    zIndex: 50,
  },
  pillWrap: {
    overflow: "visible",
  },
  pillClip: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(40,40,42,0.55)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  pillShade: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "rgba(40,40,42,0.28)",
  },
  row: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    zIndex: 2,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
    paddingVertical: 4,
  },
  label: {
    fontSize: 9.5,
    fontWeight: "600",
    letterSpacing: -0.2,
    color: "rgba(255,255,255,0.92)",
    maxWidth: "100%",
  },
  labelActive: {
    color: ACTIVE,
  },
});
