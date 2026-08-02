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
 * Barre bas en 2 groupes (gauche / droite) + logos.
 */
export default function SiteBottomNav({ activePath, onSelect }) {
  const tabs = visibleTabs();
  const mid = Math.ceil(tabs.length / 2);
  const left = tabs.slice(0, mid);
  const right = tabs.slice(mid);

  return (
    <nav className="wa-bottom-nav" aria-label="Navigation">
      <div className="wa-bottom-group wa-bottom-group-left">
        {left.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
          />
        ))}
      </div>
      <div className="wa-bottom-group wa-bottom-group-right">
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
