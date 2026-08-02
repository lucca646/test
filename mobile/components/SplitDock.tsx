import { Pressable, StyleSheet, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NAV_TINT, tabsBySide } from "app-nav";
import type { AppTab } from "app-nav";
import { useAppTheme } from "../lib/theme";

type Props = {
  activeRoute: string;
  onSelect: (routeName: string) => void;
};

function DockItem({
  tab,
  active,
  onPress,
}: {
  tab: AppTab;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useAppTheme();
  const ion = tab.ion;
  const name = (active ? ion?.active : ion?.default) || "ellipse-outline";
  const color = active ? NAV_TINT : theme.isDark
    ? "rgba(235,235,245,0.72)"
    : "rgba(60,60,67,0.72)";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.item,
        active && styles.itemOn,
        pressed && styles.itemPressed,
      ]}
    >
      <View style={styles.iconWrap}>
        <Ionicons name={name as keyof typeof Ionicons.glyphMap} size={22} color={color} />
        {tab.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{tab.badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.label, { color }]} numberOfLines={1}>
        {tab.short || tab.label}
      </Text>
    </Pressable>
  );
}

function DockGroup({
  tabs,
  activeRoute,
  onSelect,
}: {
  tabs: AppTab[];
  activeRoute: string;
  onSelect: (routeName: string) => void;
}) {
  const theme = useAppTheme();

  return (
    <View style={styles.groupOuter}>
      <BlurView
        intensity={theme.isDark ? 48 : 64}
        tint={theme.isDark ? "dark" : "light"}
        style={styles.groupBlur}
      >
        <View
          style={[
            styles.groupInner,
            {
              backgroundColor: theme.isDark
                ? "rgba(22,22,28,0.55)"
                : "rgba(255,255,255,0.55)",
              borderColor: theme.isDark
                ? "rgba(255,255,255,0.12)"
                : "rgba(0,0,0,0.08)",
            },
          ]}
        >
          {tabs.map((tab) => (
            <DockItem
              key={tab.id}
              tab={tab}
              active={activeRoute === tab.routeName}
              onPress={() => onSelect(tab.routeName)}
            />
          ))}
        </View>
      </BlurView>
    </View>
  );
}

/**
 * Barre bas iOS split G/D — même modèle que la webapp (app-nav.side).
 * Remplace UITabBar / NativeTabs (OTA JS, pas de rebuild Store).
 */
export default function SplitDock({ activeRoute, onSelect }: Props) {
  const insets = useSafeAreaInsets();
  const { left, right } = tabsBySide();

  return (
    <View
      pointerEvents="box-none"
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}
    >
      <DockGroup tabs={left} activeRoute={activeRoute} onSelect={onSelect} />
      <DockGroup tabs={right} activeRoute={activeRoute} onSelect={onSelect} />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  groupOuter: {
    flex: 1,
    maxWidth: 184,
    borderRadius: 22,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  groupBlur: {
    borderRadius: 22,
    overflow: "hidden",
  },
  groupInner: {
    flexDirection: "row",
    borderRadius: 22,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 4,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    minHeight: 52,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 16,
  },
  itemOn: {
    backgroundColor: "rgba(10,132,255,0.14)",
  },
  itemPressed: {
    opacity: 0.85,
  },
  iconWrap: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -14,
    minWidth: 22,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: "#FF3B30",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "800",
  },
});
