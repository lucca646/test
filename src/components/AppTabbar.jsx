import { useMemo } from "react";
import { Icon, Glass } from "konsta/react";
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
  { path: "/", label: "Aujourd'hui", icon: Today, iconActive: TodayFill },
  { path: "/arcade/", label: "Arcade", icon: Gamecontroller, iconActive: GamecontrollerFill },
  { path: "/search/", label: "Recherche", icon: Search, iconActive: Search },
  { path: "/settings/", label: "Réglages", icon: GearAlt, iconActive: GearAltFill },
];

function isActive(activePath, tabPath) {
  if (tabPath === "/") return activePath === "/" || activePath === "";
  const clean = tabPath.replace(/\/$/, "");
  return activePath === tabPath || activePath.startsWith(`${clean}/`) || activePath === clean;
}

export default function AppTabbar({ activePath, onSelect }) {
  const activeIndex = useMemo(() => {
    const idx = TABS.findIndex((tab) => isActive(activePath, tab.path));
    return idx < 0 ? 0 : idx;
  }, [activePath]);

  return (
    <nav className="dock" aria-label="Navigation">
      <Glass className="dock-pill">
        <span
          className="dock-bubble"
          style={{ transform: `translateX(${activeIndex * 100}%)` }}
          aria-hidden
        />
        {TABS.map((tab, index) => {
          const active = index === activeIndex;
          const Glyph = active ? tab.iconActive : tab.icon;
          return (
            <button
              key={tab.path}
              type="button"
              className={`dock-item${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => onSelect?.(tab.path)}
            >
              <span className="dock-icon">
                <Icon
                  ios={<Glyph className="w-7 h-7" />}
                  material={<Glyph className="w-6 h-6" />}
                />
              </span>
              <span className="dock-label">{tab.label}</span>
            </button>
          );
        })}
      </Glass>
    </nav>
  );
}
