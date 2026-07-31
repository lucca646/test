import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import LiquidGlassDock, { type DockTab } from "./LiquidGlassDock";

const TAB_META: Record<
  string,
  Omit<DockTab, "id">
> = {
  entreprises: {
    label: "Entreprises",
    icon: "business-outline",
    iconActive: "business",
  },
  recherche: {
    label: "Recherche",
    icon: "search-outline",
    iconActive: "search",
  },
  envois: {
    label: "Envois",
    icon: "albums-outline",
    iconActive: "albums",
  },
  parametres: {
    label: "Profil",
    icon: "person-circle-outline",
    iconActive: "person-circle",
  },
};

/**
 * Tab bar Expo Router → dock Liquid Glass (look playground validé).
 */
export default function CoraltGlassTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const tabs: DockTab[] = [];

  for (const route of state.routes) {
    const options = descriptors[route.key]?.options as {
      href?: string | null;
    };
    // expo-router : href null = onglet masqué (compte non activé, etc.)
    if (options?.href === null) continue;
    const meta = TAB_META[route.name];
    if (!meta) continue;
    tabs.push({ id: route.name, ...meta });
  }

  if (tabs.length === 0) return null;

  const activeName = state.routes[state.index]?.name;
  const activeId = tabs.some((t) => t.id === activeName)
    ? (activeName as string)
    : tabs[0].id;

  return (
    <LiquidGlassDock
      tabs={tabs}
      activeId={activeId}
      onChange={(id) => {
        const route = state.routes.find((r) => r.name === id);
        if (!route) return;
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (event.defaultPrevented) return;
        navigation.navigate(id as never);
      }}
    />
  );
}
