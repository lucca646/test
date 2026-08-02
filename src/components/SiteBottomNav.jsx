import { tabsBySide } from "app-nav";
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

function NavItem({ tab, activePath, onSelect }) {
  const on =
    tab.path === "/"
      ? activePath === "/"
      : activePath.startsWith(tab.path.replace(/\/$/, ""));
  const Def = F7[tab.f7.default] || Search;
  const Act = F7[tab.f7.active] || Def;
  const Icon = on ? Act : Def;

  return (
    <button
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
}

/**
 * Barre bas web : deux pilules (gauche / droite), groups depuis app-nav.side.
 * iOS reste sur UITabBar (une barre) — split natif = dock custom + rebuild.
 */
export default function SiteBottomNav({ activePath, onSelect }) {
  const { left, right } = tabsBySide();

  return (
    <nav className="wa-bottom-nav" aria-label="Navigation">
      <div className="wa-bottom-group" style={{ "--nav-count": left.length }}>
        {left.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="wa-bottom-group" style={{ "--nav-count": right.length }}>
        {right.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
      </div>
    </nav>
  );
}
