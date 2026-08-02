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
 * Une seule barre bas + logos — même principe visuel que UITabBar iOS.
 * (Les groupes gauche/droite cassaient la parité avec l’app native.)
 */
export default function SiteBottomNav({ activePath, onSelect }) {
  const tabs = visibleTabs();

  return (
    <nav
      className="wa-bottom-nav"
      aria-label="Navigation"
      style={{ "--nav-count": tabs.length }}
    >
      <div className="wa-bottom-pill">
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
      </div>
    </nav>
  );
}
