import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
  type ViewStyle,
} from "react-native";
import * as Haptics from "expo-haptics";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Ionicons } from "@expo/vector-icons";
import { useColors, type ThemeColors } from "../theme";

/** Icône façon iOS Settings : carré arrondi coloré + glyphe blanc. */
export function RowIcon({
  name,
  backgroundColor,
}: {
  name: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
}) {
  return (
    <View style={[styles.rowIcon, { backgroundColor }]}>
      <Ionicons name={name} size={17} color="#fff" />
    </View>
  );
}

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
  subtitle,
  icon,
  onPress,
  destructive,
  last,
  accentValue,
  rightElement,
  switchValue,
  onSwitchChange,
  switchDisabled,
  switchResyncKey,
}: {
  label: string;
  value?: string;
  subtitle?: string;
  icon?: { name: keyof typeof Ionicons.glyphMap; backgroundColor: string };
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
  accentValue?: boolean;
  /** Élément custom à droite (prioritaire sur `value`/chevron), ex. un `Switch`. */
  rightElement?: React.ReactNode;
  /** Raccourci : affiche un `Switch` natif iOS à droite. */
  switchValue?: boolean;
  onSwitchChange?: (next: boolean) => void;
  switchDisabled?: boolean;
  /**
   * Change cette valeur (ex. compteur incrémenté à chaque toggle) pour forcer
   * le remount du `Switch` natif — évite le bug iOS connu où le composant
   * reste visuellement sur la position du dernier tap alors que `switchValue`
   * n'a pas changé (ex. action refusée/asynchrone qui ne modifie pas l'état).
   */
  switchResyncKey?: string | number;
}) {
  const c = useColors();
  const showSwitch = switchValue !== undefined;
  const inner = (
    <View
      style={[
        styles.row,
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: c.separator,
        },
      ]}
    >
      {icon ? <RowIcon name={icon.name} backgroundColor={icon.backgroundColor} /> : null}
      <View style={styles.rowTextCol}>
        <Text
          style={[styles.rowLabel, { color: destructive ? c.danger : c.text }]}
          numberOfLines={1}
        >
          {label}
        </Text>
        {subtitle ? (
          <Text style={[styles.rowSubtitle, { color: c.muted }]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement ? (
        rightElement
      ) : showSwitch ? (
        <Switch
          key={switchResyncKey}
          value={switchValue}
          onValueChange={onSwitchChange}
          disabled={switchDisabled}
          trackColor={{ true: c.accent, false: c.searchBg }}
        />
      ) : (
        <>
          {value ? (
            <Text
              style={[
                styles.rowValue,
                { color: accentValue && onPress ? c.accent : c.muted },
              ]}
              numberOfLines={2}
            >
              {value}
            </Text>
          ) : null}
          {onPress ? (
            <Text style={[styles.chevron, { color: c.chevron }]}>›</Text>
          ) : null}
        </>
      )}
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        pressed && { backgroundColor: c.rowPressed },
      ]}
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
  size = "md",
}: {
  label: string;
  onPress: () => void;
  variant?: "primary" | "tinted" | "gray" | "destructive";
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md";
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
    variant === "tinted"
      ? c.accent
      : variant === "gray"
        ? c.text
        : "#fff";

  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.btn,
        size === "sm" && styles.btnSm,
        {
          backgroundColor: bg,
          opacity: disabled ? 0.4 : pressed ? 0.82 : 1,
        },
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
  actionLabel,
  onAction,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const c = useColors();
  return (
    <View style={styles.empty}>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.emptySub, { color: c.muted }]}>{subtitle}</Text>
      ) : null}
      {actionLabel && onAction ? (
        <Pressable
          onPress={() => {
            Haptics.selectionAsync().catch(() => {});
            onAction();
          }}
          style={[styles.emptyAction, { backgroundColor: c.pillBg }]}
        >
          <Text style={[styles.emptyActionText, { color: c.accent }]}>
            {actionLabel}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

/**
 * Vrai `UISegmentedControl` iOS natif (module natif
 * `@react-native-segmented-control/segmented-control`), pas une imitation en
 * JS : verre système + pill + haptique + rendu identiques au reste de l'OS
 * (barre d'onglets, Réglages…). Nécessite un build natif (pas livrable en
 * simple OTA JS) car il embarque du code Swift/Objective-C.
 */
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
  const dark = c.statusBar === "light";
  const selectedIndex = Math.max(0, options.findIndex((o) => o.id === value));
  return (
    <SegmentedControl
      values={options.map((o) => o.label)}
      selectedIndex={selectedIndex}
      onChange={(event) => {
        Haptics.selectionAsync().catch(() => {});
        const opt = options[event.nativeEvent.selectedSegmentIndex];
        if (opt) onChange(opt.id);
      }}
      appearance={dark ? "dark" : "light"}
      tintColor={c.accent}
      fontStyle={{ fontSize: 13, fontWeight: "600", color: c.muted }}
      activeFontStyle={{ fontSize: 13, fontWeight: "600", color: "#fff" }}
      style={styles.segmented}
    />
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
      ? c.bannerErrorBg
      : tone === "success"
        ? c.bannerSuccessBg
        : c.bannerInfoBg;
  const border =
    tone === "error"
      ? c.bannerErrorBorder
      : tone === "success"
        ? c.bannerSuccessBorder
        : c.bannerInfoBorder;
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
  return (
    <Pressable
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
    >
      {body}
    </Pressable>
  );
}

export function StatusPill({
  kind,
  label,
}: {
  kind: "contact" | "sent" | "no_contact" | "in_progress" | string;
  label: string;
}) {
  const c = useColors();
  const bg =
    kind === "sent"
      ? c.pillSentBg
      : kind === "no_contact"
        ? c.pillMutedBg
        : kind === "in_progress"
          ? c.pillWarnBg
          : c.pillBg;
  const color =
    kind === "sent"
      ? c.pillSentText
      : kind === "no_contact"
        ? c.pillMutedText
        : kind === "in_progress"
          ? c.pillWarnText
          : c.pillText;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
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
    borderRadius: 12,
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
  rowIcon: {
    width: 29,
    height: 29,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTextCol: { flex: 1, gap: 1 },
  rowLabel: { fontSize: 17 },
  rowSubtitle: { fontSize: 13, lineHeight: 17 },
  rowValue: { fontSize: 16, maxWidth: "52%", textAlign: "right" },
  chevron: { fontSize: 20, marginTop: -1 },
  btn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  btnSm: {
    minHeight: 44,
    paddingVertical: 10,
  },
  btnText: { fontSize: 17, fontWeight: "600", letterSpacing: -0.2 },
  empty: {
    paddingVertical: 48,
    paddingHorizontal: 28,
    alignItems: "center",
    gap: 8,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: "600",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyAction: {
    marginTop: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 44,
    justifyContent: "center",
  },
  emptyActionText: { fontSize: 16, fontWeight: "600" },
  segmented: {
    marginHorizontal: 16,
    height: 34,
  },
  banner: {
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 14,
    borderWidth: StyleSheet.hairlineWidth,
    gap: 4,
  },
  bannerTitle: { fontSize: 15, fontWeight: "600" },
  bannerSub: { fontSize: 13, lineHeight: 18 },
  pill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
    maxWidth: 140,
  },
  pillText: {
    fontSize: 11,
    fontWeight: "700",
  },
});
