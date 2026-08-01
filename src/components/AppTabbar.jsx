import { LiquidGlassNav } from "liquid-glass-nav";
import {
  Today,
  TodayFill,
  Rocket,
  RocketFill,
  Layers,
  LayersFill,
  Gamecontroller,
  GamecontrollerFill,
} from "framework7-icons/react/framework7-icons-react.esm.js";
import { usePlatform } from "../platform/PlatformContext.jsx";

/** Aligné sur l’app native : Recherche retirée de la barre (OTA). */
const ITEMS = [
  {
    id: "/",
    label: "Aujourd'hui",
    short: "Today",
    icon: <Today className="w-6 h-6" />,
    iconActive: <TodayFill className="w-6 h-6" />,
  },
  {
    id: "/games/",
    label: "Jeux",
    short: "Jeux",
    icon: <Rocket className="w-6 h-6" />,
    iconActive: <RocketFill className="w-6 h-6" />,
  },
  {
    id: "/apps/",
    label: "Apps",
    short: "Apps",
    icon: <Layers className="w-6 h-6" />,
    iconActive: <LayersFill className="w-6 h-6" />,
  },
  {
    id: "/arcade/",
    label: "Arcade",
    short: "Arcade",
    icon: <Gamecontroller className="w-6 h-6" />,
    iconActive: <GamecontrollerFill className="w-6 h-6" />,
  },
];

/** Même items — rendu nav selon plateforme */
export default function AppTabbar({ activePath, onSelect }) {
  const { platform, meta } = usePlatform();

  if (platform === "android") {
    return (
      <nav className="m3-nav" aria-label="Navigation Android">
        {ITEMS.map((tab) => {
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
          {ITEMS.map((tab) => {
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
      items={ITEMS}
      activeId={activePath}
      onChange={onSelect}
      activeColor={meta.accent}
    />
  );
}
