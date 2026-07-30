import { Tabbar, TabbarLink, ToolbarPane, Icon } from "konsta/react";
import { f7 } from "framework7-react";

const TABS = [
  { path: "/", label: "Aujourd'hui", icon: "today" },
  { path: "/arcade/", label: "Arcade", icon: "gamecontroller" },
  { path: "/search/", label: "Recherche", icon: "search" },
  { path: "/settings/", label: "Réglages", icon: "gear_alt" },
];

function isActive(activePath, tabPath) {
  if (tabPath === "/") return activePath === "/" || activePath === "";
  const clean = tabPath.replace(/\/$/, "");
  return activePath === tabPath || activePath.startsWith(`${clean}/`) || activePath === clean;
}

export default function AppTabbar({ activePath }) {
  return (
    <Tabbar labels icons className="left-0 bottom-0 fixed z-50">
      <ToolbarPane>
        {TABS.map((tab) => (
          <TabbarLink
            key={tab.path}
            active={isActive(activePath, tab.path)}
            label={tab.label}
            icon={<Icon ios={`f7:${tab.icon}`} className="text-[22px]" />}
            onClick={() => {
              f7.views.main.router.navigate(tab.path, {
                animate: true,
                transition:
                  tab.path === "/arcade/"
                    ? "f7-cover"
                    : tab.path === "/search/"
                      ? "f7-parallax"
                      : tab.path === "/settings/"
                        ? "f7-push"
                        : "f7-fade",
              });
            }}
          />
        ))}
      </ToolbarPane>
    </Tabbar>
  );
}
