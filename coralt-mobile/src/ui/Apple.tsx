import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import { colors } from "../theme";

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export function Group({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.group, style]}>{children}</View>;
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
  const inner = (
    <View style={[styles.row, !last && styles.rowBorder]}>
      <Text style={[styles.rowLabel, destructive && { color: colors.danger }]}>
        {label}
      </Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      {onPress ? <Text style={styles.chevron}>›</Text> : null}
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
  const bg =
    variant === "primary"
      ? colors.accent
      : variant === "destructive"
        ? colors.danger
        : variant === "tinted"
          ? "rgba(10,132,255,0.18)"
          : "rgba(120,120,128,0.24)";
  const color =
    variant === "tinted" || variant === "gray" ? colors.accent : "#fff";
  const textColor = variant === "gray" ? colors.text : color;

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
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.btnText, { color: textColor }]}>{label}</Text>
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
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyTitle}>{title}</Text>
      {subtitle ? <Text style={styles.emptySub}>{subtitle}</Text> : null}
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
  return (
    <View style={styles.segmented}>
      {options.map((o) => {
        const on = o.id === value;
        return (
          <Pressable
            key={o.id}
            onPress={() => onChange(o.id)}
            style={[styles.segItem, on && styles.segOn]}
          >
            <Text style={[styles.segText, on && styles.segTextOn]}>{o.label}</Text>
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
  const bg =
    tone === "error"
      ? "rgba(255,69,58,0.14)"
      : tone === "success"
        ? "rgba(48,209,88,0.14)"
        : "rgba(10,132,255,0.14)";
  const border =
    tone === "error"
      ? "rgba(255,69,58,0.35)"
      : tone === "success"
        ? "rgba(48,209,88,0.35)"
        : "rgba(10,132,255,0.35)";
  const titleColor =
    tone === "error"
      ? colors.danger
      : tone === "success"
        ? colors.success
        : colors.accent;

  const body = (
    <View style={[styles.banner, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.bannerTitle, { color: titleColor }]}>{title}</Text>
      {subtitle ? <Text style={styles.bannerSub}>{subtitle}</Text> : null}
    </View>
  );
  if (!onPress) return body;
  return <Pressable onPress={onPress}>{body}</Pressable>;
}

const styles = StyleSheet.create({
  sectionHeader: {
    color: "rgba(235,235,245,0.6)",
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
    backgroundColor: "rgba(28,28,30,0.92)",
    borderRadius: 14,
    overflow: "hidden",
  },
  row: {
    minHeight: 44,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(84,84,88,0.65)",
  },
  rowLabel: { flex: 1, color: "#fff", fontSize: 17 },
  rowValue: { color: "rgba(235,235,245,0.6)", fontSize: 17, maxWidth: "55%" },
  chevron: { color: "rgba(235,235,245,0.3)", fontSize: 22, marginTop: -2 },
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
    color: "rgba(235,235,245,0.6)",
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySub: {
    color: "rgba(235,235,245,0.4)",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  segmented: {
    flexDirection: "row",
    backgroundColor: "rgba(118,118,128,0.24)",
    borderRadius: 10,
    padding: 2,
    marginHorizontal: 16,
  },
  segItem: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: "center",
  },
  segOn: { backgroundColor: "rgba(99,99,102,0.9)" },
  segText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
  },
  segTextOn: { color: "#fff" },
  banner: {
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  bannerTitle: { fontSize: 15, fontWeight: "700" },
  bannerSub: { color: "rgba(235,235,245,0.6)", fontSize: 13, lineHeight: 18 },
});
