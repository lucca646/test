import { useEffect } from "react";
import { Tabs } from "expo-router";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { APP_TABS } from "app-nav";
import SplitDock from "../components/SplitDock";
import { applyOtaUpdateIfAny } from "../lib/ota";

function SplitTabBar({ state, navigation }: BottomTabBarProps) {
  const activeRoute = state.routes[state.index]?.name ?? "index";

  return (
    <SplitDock
      activeRoute={activeRoute}
      onSelect={(routeName) => {
        const route = state.routes.find((r) => r.name === routeName);
        if (!route) return;
        const event = navigation.emit({
          type: "tabPress",
          target: route.key,
          canPreventDefault: true,
        });
        if (!event.defaultPrevented) {
          navigation.navigate(routeName);
        }
      }}
    />
  );
}

/**
 * Tabs JS + dock split G/D (pas UITabBar).
 * Onglets / sides depuis packages/app-nav — OTA web + iOS.
 */
export default function RootLayout() {
  useEffect(() => {
    void applyOtaUpdateIfAny();
  }, []);

  return (
    <Tabs
      tabBar={(props) => <SplitTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Le dock custom est absolute ; on réserve l’espace contenu.
        sceneStyle: { paddingBottom: 88 },
      }}
    >
      {APP_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.routeName}
          name={tab.routeName}
          options={{
            title: tab.label,
            href: tab.hidden ? null : undefined,
          }}
        />
      ))}
    </Tabs>
  );
}
