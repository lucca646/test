import { Tabbar, TabbarLink, ToolbarPane, Icon } from "konsta/react";
import { f7 } from "framework7-react";
import {
  Today,
  TodayFill,
  Gamecontroller,
  GamecontrollerFill,
  Search,
  GearAlt,
  GearAltFill,
} from "framework7-icons/react/framework7-icons-react.esm.js";

const TABS = [
  {
    path: "/",
    label: "Aujourd'hui",
    icon: Today,
    iconActive: TodayFill,
    transition: "f7-fade",
  },
  {
    path: "/arcade/",
    label: "Arcade",
    icon: Gamecontroller,
    iconActive: GamecontrollerFill,
    transition: "f7-cover",
  },
  {
    path: "/search/",
    label: "Recherche",
    icon: Search,
    iconActive: Search,
    transition: "f7-parallax",
  },
  {
    path: "/settings/",
    label: "Réglages",
    icon: GearAlt,
    iconActive: GearAltFill,
    transition: "f7-push",
  },
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
        {TABS.map((tab) => {
          const active = isActive(activePath, tab.path);
          const Glyph = active ? tab.iconActive : tab.icon;
          return (
            <TabbarLink
              key={tab.path}
              active={active}
              label={tab.label}
              icon={
                <Icon
                  ios={<Glyph className="w-7 h-7" />}
                  material={<Glyph className="w-6 h-6" />}
                />
              }
              onClick={() => {
                f7.views.main.router.navigate(tab.path, {
                  animate: true,
                  transition: tab.transition,
                });
              }}
            />
          );
        })}
      </ToolbarPane>
    </Tabbar>
  );
}
