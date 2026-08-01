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
import { colors } from "../theme";

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
  return (
    <View style={styles.cardInner}>
      <Text style={styles.title} numberOfLines={2}>
        {prospect.entreprise || "Entreprise"}
      </Text>
      <Text style={styles.sub} numberOfLines={2}>
        {[prospect.ville, prospect.email, prospect.contact]
          .filter(Boolean)
          .join(" · ")}
      </Text>
      <View style={styles.divider} />
      <Text style={styles.mailLabel}>Objet</Text>
      <Text style={styles.mailSubject} numberOfLines={2}>
        {prospect.mailSubject || "(sans objet)"}
      </Text>
      <Text style={styles.mailLabel}>Message</Text>
      <ScrollView
        style={styles.bodyScroll}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.mailBody}>
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
        translateX.value = withTiming(EXIT_X, { duration: 220 }, () => {
          runOnJS(onCommit)("send");
        });
      } else if (goLeft) {
        translateX.value = withTiming(-EXIT_X, { duration: 220 }, () => {
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
        [-12, 0, 12],
        Extrapolation.CLAMP,
      );
      return {
        transform: [
          { translateX: translateX.value },
          { translateY: 0 },
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
        { translateX: depth * 10 },
        { translateY: depth * 8 },
        { scale: 1 - depth * 0.04 },
      ],
      opacity: depth === 1 ? 0.72 : 0.4,
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

  const body = (
    <Animated.View style={[styles.card, animStyle]}>
      {active ? (
        <>
          <Animated.View
            pointerEvents="none"
            style={[styles.overlay, styles.overlaySend, sendOverlay]}
          >
            <Text style={styles.overlaySendText}>Envoyer</Text>
          </Animated.View>
          <Animated.View
            pointerEvents="none"
            style={[styles.overlay, styles.overlaySkip, skipOverlay]}
          >
            <Text style={styles.overlaySkipText}>Passer</Text>
          </Animated.View>
        </>
      ) : null}
      <CardFace prospect={prospect} />
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
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 8,
    justifyContent: "center",
  },
  card: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
  },
  cardInner: {
    flex: 1,
    padding: 20,
    gap: 8,
  },
  title: {
    color: colors.text,
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.6,
  },
  sub: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(84,84,88,0.65)",
    marginVertical: 6,
  },
  mailLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  mailSubject: { color: colors.text, fontSize: 17, fontWeight: "600" },
  bodyScroll: { flex: 1, marginTop: 2 },
  mailBody: {
    color: "rgba(235,235,245,0.88)",
    fontSize: 15,
    lineHeight: 22,
    paddingBottom: 12,
  },
  overlay: {
    position: "absolute",
    top: 22,
    zIndex: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 2,
  },
  overlaySend: {
    left: 18,
    borderColor: colors.success,
    backgroundColor: "rgba(48,209,88,0.12)",
    transform: [{ rotate: "-8deg" }],
  },
  overlaySkip: {
    right: 18,
    borderColor: colors.danger,
    backgroundColor: "rgba(255,69,58,0.12)",
    transform: [{ rotate: "8deg" }],
  },
  overlaySendText: {
    color: colors.success,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
  },
  overlaySkipText: {
    color: colors.danger,
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.4,
  },
});
