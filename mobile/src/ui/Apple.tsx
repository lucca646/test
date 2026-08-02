import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { useColors, type ThemeColors } from "../theme";

export function SectionHeader({ title }: { title: string }) {
  const c = useColors();
  return (
    <Text style={[styles.sectionHeader, { color: c.muted }]}>{title}</Text>
  );
}

export function Group({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  const c = useColors();
  return (
    <View
      style={[
        styles.group,
        { backgroundColor: c.card, borderColor: c.border },
        style,
      ]}
    >
      {children}
    </View>
  );
}

export function Row({
  label,
  value,
  onPress,
  destructive,
  last,
}: {
  label: string;
  value?: string;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const c = useColors();
  const inner = (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.separator },
      ]}
    >
      <Text style={[styles.rowLabel, { color: destructive ? c.danger : c.text }]}>
        {label}
      </Text>
      {value ? (
        <Text style={[styles.rowValue, { color: c.muted }]} numberOfLines={2}>
          {value}
        </Text>
      ) : null}
      {onPress ? <Text style={[styles.chevron, { color: c.chevron }]}>›</Text> : null}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
    >
      {inner}
    </Pressable>
  );
}

export function Button({
  label,
  onPress,
  variant = "primary",
  disabled,
  loading,
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "tinted" | "gray" | "destructive";
  disabled?: boolean;
  loading?: boolean;
}) {
  const c = useColors();
  const bg =
    variant === "primary"
      ? c.accent
      : variant === "destructive"
        ? c.danger
        : variant === "tinted"
          ? c.pillBg
          : c.searchBg;
  const textColor =
    variant === "tinted" || variant === "gray" ? c.accent : "#fff";
  const grayText = variant === "gray" ? c.text : textColor;

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        { backgroundColor: bg, opacity: disabled ? 0.45 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={grayText} />
      ) : (
        <Text style={[styles.btnText, { color: grayText }]}>{label}</Text>
      )}
    </Pressable>
  );
}

export function EmptyState({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: c.muted }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySub, { color: c.muted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

export function Segmented({
  options,
  value,
  onChange,
}: {
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  const c = useColors();
  return (
    <View style={[styles.segmented, { backgroundColor: c.searchBg }]}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[
              styles.segItem,
              on && { backgroundColor: c.cardSolid },
            ]}
          >
            <Text
              style={[
                styles.segText,
                { color: on ? c.text : c.muted },
              ]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Banner({
  tone = "info",
  title,
  subtitle,
  onPress,
}: {
  tone?: "info" | "error" | "success";
  title: string;
  subtitle?: string;
  onPress?: () => void;
}) {
  const c = useColors();
  const bg =
    tone === "error"
      ? "rgba(255,69,58,0.14)"
      : tone === "success"
        ? "rgba(48,209,88,0.14)"
        : c.pillBg;
  const border =
    tone === "error"
      ? "rgba(255,69,58,0.35)"
      : tone === "success"
        ? "rgba(48,209,88,0.35)"
        : "rgba(10,132,255,0.35)";
  const titleColor =
    tone === "error"
      ? c.danger
      : tone === "success"
        ? c.success
        : c.accent;

  const body = (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.bannerTitle, { color: titleColor }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.bannerSub, { color: c.muted }]}>{subtitle}</Text>
      ) : null}
    </View>
  );
  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

/** @deprecated use useColors() */
export type { ThemeColors };

const styles = StyleSheet.create({
  sectionHeader: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginHorizontal: 20,
    marginTop: 22,
    marginBottom: 8,
  },
  group: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
  },
  row: {
    minHeight: 48,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowLabel: { flex: 1, fontSize: 17 },
  rowValue: { fontSize: 16, maxWidth: "52%", textAlign: "right" },
  chevron: { fontSize: 22, marginTop: -2 },
  btn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  btnText: { fontSize: 17, fontWeight: "600" },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 6,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  segmented: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    marginHorizontal: 16,
  },
  segItem: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: "center",
  },
  segText: {
    fontSize: 13,
    fontWeight: "600",
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  bannerTitle: { fontSize: 15, fontWeight: "700" },
  bannerSub: { fontSize: 13, lineHeight: 18 },
});
