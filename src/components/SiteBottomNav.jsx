import { visibleTabs } from "app-nav";
import {
  Today,
  TodayFill,
  Rocket,
  RocketFill,
  Layers,
  LayersFill,
  Gamecontroller,
  GamecontrollerFill,
  Search,
} from "framework7-icons/react/framework7-icons-react.esm.js";

const F7 = {
  Today,
  TodayFill,
  Rocket,
  RocketFill,
  Layers,
  LayersFill,
  Gamecontroller,
  GamecontrollerFill,
  Search,
};

/**
 * Barre bas simple + logos — webapp (pas Liquid Glass / pas header site).
 */
export default function SiteBottomNav({ activePath, onSelect }) {
  const tabs = visibleTabs();

  return (
    <nav
      className="wa-bottom-nav"
      aria-label="Navigation"
      style={{ "--nav-count": tabs.length }}
    >
      {tabs.map((tab) => {
        const on =
          tab.path === "/"
            ? activePath === "/"
            : activePath.startsWith(tab.path.replace(/\/$/, ""));
        const Def = F7[tab.f7.default] || Search;
        const Act = F7[tab.f7.active] || Def;
        const Icon = on ? Act : Def;
        return (
          <button
            key={tab.id}
            type="button"
            className={`wa-bottom-item${on ? " is-on" : ""}`}
            aria-current={on ? "page" : undefined}
            onClick={() => onSelect(tab.path)}
          >
            <span className="wa-bottom-icon" aria-hidden>
              <Icon />
            </span>
            <span className="wa-bottom-label">{tab.short || tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
