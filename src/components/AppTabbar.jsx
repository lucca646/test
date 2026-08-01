import { LiquidGlassNav } from "liquid-glass-nav";
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
import { usePlatform } from "../platform/PlatformContext.jsx";

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

/** Items = source unique packages/app-nav (même JS que NativeTabs iOS). */
function itemsFromSharedNav() {
  return visibleTabs().map((tab) => {
    const Def = F7[tab.f7.default] || Search;
    const Act = F7[tab.f7.active] || Def;
    return {
      id: tab.path,
      label: tab.label,
      short: tab.short,
      icon: <Def className="w-6 h-6" />,
      iconActive: <Act className="w-6 h-6" />,
    };
  });
}

/** Même items — rendu nav selon plateforme */
export default function AppTabbar({ activePath, onSelect }) {
  const { platform, meta } = usePlatform();
  const items = itemsFromSharedNav();

  if (platform === "android") {
    return (
      <nav className="m3-nav" aria-label="Navigation Android">
        {items.map((tab) => {
          const on =
            tab.id === "/"
              ? activePath === "/"
              : activePath.startsWith(tab.id.replace(/\/$/, ""));
          return (
            <button
              key={tab.id}
              type="button"
              className={`m3-nav-item${on ? " is-on" : ""}`}
              aria-current={on ? "page" : undefined}
              onClick={() => onSelect(tab.id)}
            >
              <span className="m3-nav-indicator" aria-hidden />
              <span className="m3-nav-icon">{on ? tab.iconActive : tab.icon}</span>
              <span className="m3-nav-label">{tab.short}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  if (platform === "web") {
    return (
      <nav className="web-nav" aria-label="Navigation Web">
        <div className="web-nav-brand">Liquid Glass</div>
        <div className="web-nav-tabs">
          {items.map((tab) => {
            const on =
              tab.id === "/"
                ? activePath === "/"
                : activePath.startsWith(tab.id.replace(/\/$/, ""));
            return (
              <button
                key={tab.id}
                type="button"
                className={`web-nav-tab${on ? " is-on" : ""}`}
                aria-current={on ? "page" : undefined}
                onClick={() => onSelect(tab.id)}
              >
                <span className="web-nav-icon">{on ? tab.iconActive : tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <LiquidGlassNav
      items={items}
      activeId={activePath}
      onChange={onSelect}
      activeColor={meta.accent}
    />
  );
}
