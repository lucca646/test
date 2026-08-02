import { useEffect } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import type { Prospect } from "../api/mailing";
import { useColors } from "../theme";

const { width: SCREEN_W } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_W * 0.28;
const EXIT_X = SCREEN_W * 1.25;
const SPRING = { damping: 18, stiffness: 220, mass: 0.75 };

type Direction = "send" | "skip";

type Props = {
  prospects: Prospect[];
  disabled?: boolean;
  onSend: (p: Prospect) => void | Promise<void>;
  onSkip: (p: Prospect) => void | Promise<void>;
};

function CardFace({ prospect }: { prospect: Prospect }) {
  const c = useColors();
  const meta = [prospect.ville, prospect.contact].filter(Boolean).join(" · ");
  return (
    <View style={styles.cardInner}>
      <Text style={[styles.title, { color: c.text }]} numberOfLines={2}>
        {prospect.entreprise || "Entreprise"}
      </Text>
      {meta ? (
        <Text style={[styles.sub, { color: c.muted }]} numberOfLines={1}>
          {meta}
        </Text>
      ) : null}
      {prospect.email ? (
        <Text style={[styles.email, { color: c.muted }]} numberOfLines={1}>
          {prospect.email}
        </Text>
      ) : null}
      <View style={[styles.divider, { backgroundColor: c.separator }]} />
      <Text style={[styles.mailLabel, { color: c.muted }]}>Objet</Text>
      <Text style={[styles.mailSubject, { color: c.text }]} numberOfLines={2}>
        {prospect.mailSubject || "(sans objet)"}
      </Text>
      <Text style={[styles.mailLabel, { color: c.muted }]}>Message</Text>
      <ScrollView
        style={styles.bodyScroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.mailBody, { color: c.text }]}>
          {prospect.mailBody || "Pas de corps de mail."}
        </Text>
      </ScrollView>
    </View>
  );
}

function StackCard({
  prospect,
  index,
  active,
  translateX,
  disabled,
  onCommit,
}: {
  prospect: Prospect;
  index: number;
  active: boolean;
  translateX: SharedValue<number>;
  disabled?: boolean;
  onCommit: (dir: Direction) => void;
}) {
  const c = useColors();
  const pan = Gesture.Pan()
    .enabled(active && !disabled)
    .activeOffsetX([-12, 12])
    .failOffsetY([-24, 24])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const goRight =
        translateX.value > SWIPE_THRESHOLD || e.velocityX > 900;
      const goLeft =
        translateX.value < -SWIPE_THRESHOLD || e.velocityX < -900;
      if (goRight) {
        translateX.value = withTiming(EXIT_X, { duration: 200 }, () => {
          runOnJS(onCommit)("send");
        });
      } else if (goLeft) {
        translateX.value = withTiming(-EXIT_X, { duration: 200 }, () => {
          runOnJS(onCommit)("skip");
        });
      } else {
        translateX.value = withSpring(0, SPRING);
      }
    });

  const animStyle = useAnimatedStyle(() => {
    if (active) {
      const rot = interpolate(
        translateX.value,
        [-SCREEN_W, 0, SCREEN_W],
        [-8, 0, 8],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateX: translateX.value },
          { rotate: `${rot}deg` },
          { scale: 1 },
        ],
        opacity: 1,
        zIndex: 10,
      };
    }
    const depth = index;
    return {
      transform: [
        { translateX: 0 },
        { translateY: depth * 6 },
        { scale: 1 - depth * 0.03 },
      ],
      opacity: 1,
      zIndex: 10 - depth,
    };
  });

  const sendOverlay = useAnimatedStyle(() => ({
    opacity: active
      ? interpolate(
          translateX.value,
          [0, SWIPE_THRESHOLD],
          [0, 1],
          Extrapolation.CLAMP,
        )
      : 0,
  }));
  const skipOverlay = useAnimatedStyle(() => ({
    opacity: active
      ? interpolate(
          translateX.value,
          [-SWIPE_THRESHOLD, 0],
          [1, 0],
          Extrapolation.CLAMP,
        )
      : 0,
  }));

  const backBg = index >= 2 ? c.stackSilhouette : c.cardSolid;

  const body = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: active ? c.cardSolid : backBg,
          borderColor: c.border,
          shadowOpacity: c.statusBar === "dark" ? 0.12 : 0.28,
        },
        animStyle,
      ]}
    >
      {active ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.overlay,
              styles.overlaySend,
              { borderColor: c.success, backgroundColor: c.bannerSuccessBg },
              sendOverlay,
            ]}
          >
            <Text style={[styles.overlayText, { color: c.success }]}>
              Envoyer
            </Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.overlay,
              styles.overlaySkip,
              { borderColor: c.danger, backgroundColor: c.bannerErrorBg },
              skipOverlay,
            ]}
          >
            <Text style={[styles.overlayText, { color: c.danger }]}>
              Passer
            </Text>
          </Animated.View>
          <CardFace prospect={prospect} />
        </>
      ) : (
        <View style={[styles.backFace, { backgroundColor: backBg }]} />
      )}
    </Animated.View>
  );

  if (!active) return body;
  return <GestureDetector gesture={pan}>{body}</GestureDetector>;
}

/** Deck : swipe droite = envoyer, gauche = passer. Max 3 cartes empilées. */
export default function SwipeDeck({
  prospects,
  disabled,
  onSend,
  onSkip,
}: Props) {
  const translateX = useSharedValue(0);
  const top = prospects[0];
  const visible = prospects.slice(0, 3);

  useEffect(() => {
    translateX.value = 0;
  }, [top?.row_index, top?.id, translateX]);

  const commit = (dir: Direction) => {
    if (!top) return;
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(
      () => {},
    );
    translateX.value = 0;
    if (dir === "send") void onSend(top);
    else void onSkip(top);
  };

  if (!top) return null;

  return (
    <View style={styles.deck}>
      {[...visible].reverse().map((p, revIdx) => {
        const stackIndex = visible.length - 1 - revIdx;
        const key = String(p.row_index ?? p.id ?? stackIndex);
        return (
          <StackCard
            key={key}
            prospect={p}
            index={stackIndex}
            active={stackIndex === 0}
            translateX={translateX}
            disabled={disabled}
            onCommit={commit}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  deck: {
    flex: 1,
    marginHorizontal: 20,
    justifyContent: "center",
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    shadowColor: "#000",
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  backFace: {
    flex: 1,
  },
  cardInner: {
    flex: 1,
    padding: 20,
    gap: 6,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  sub: { fontSize: 13, lineHeight: 18 },
  email: { fontSize: 13, lineHeight: 18 },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 8,
  },
  mailLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  mailSubject: { fontSize: 17, fontWeight: "600" },
  bodyScroll: { flex: 1, marginTop: 2 },
  mailBody: {
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: 12,
  },
  overlay: {
    position: "absolute",
    top: 16,
    zIndex: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  overlaySend: {
    left: 16,
    transform: [{ rotate: "-6deg" }],
  },
  overlaySkip: {
    right: 16,
    transform: [{ rotate: "6deg" }],
  },
  overlayText: {
    fontWeight: "700",
    fontSize: 13,
    letterSpacing: 0.2,
  },
});
