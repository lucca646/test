import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, Glass } from "konsta/react";
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

/** 5 onglets = App Store Apple */
const TABS = [
  { path: "/", label: "Aujourd'hui", icon: Today, iconActive: TodayFill },
  { path: "/games/", label: "Jeux", icon: Rocket, iconActive: RocketFill },
  { path: "/apps/", label: "Apps", icon: Layers, iconActive: LayersFill },
  { path: "/arcade/", label: "Arcade", icon: Gamecontroller, iconActive: GamecontrollerFill },
  { path: "/search/", label: "Recherche", icon: Search, iconActive: Search },
];

const BLUE = "#0a84ff";
const TAB_COUNT = TABS.length;

function isActive(activePath, tabPath) {
  if (tabPath === "/") return activePath === "/" || activePath === "";
  const clean = tabPath.replace(/\/$/, "");
  return activePath === tabPath || activePath.startsWith(`${clean}/`) || activePath === clean;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function nearestIndex(x) {
  return clamp(Math.round(x), 0, TAB_COUNT - 1);
}

export default function AppTabbar({ activePath, onSelect }) {
  const pillRef = useRef(null);
  const dragRef = useRef({
    touching: false,
    moved: false,
    left: 0,
    slot: 0,
    index: 0,
    startX: 0,
  });

  const activeIndex = useMemo(() => {
    const idx = TABS.findIndex((tab) => isActive(activePath, tab.path));
    return idx < 0 ? 0 : idx;
  }, [activePath]);

  const [bubbleX, setBubbleX] = useState(activeIndex);
  const [pressed, setPressed] = useState(false);

  const highlightIndex = nearestIndex(bubbleX);

  useEffect(() => {
    if (dragRef.current.touching) return;
    setBubbleX(activeIndex);
  }, [activeIndex]);

  const measure = () => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { left: rect.left, slot: rect.width / TAB_COUNT };
  };

  const xFromClient = (clientX, m) =>
    clamp((clientX - m.left) / m.slot - 0.5, 0, TAB_COUNT - 1);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    const x = xFromClient(e.clientX, m);
    dragRef.current = {
      touching: true,
      moved: false,
      left: m.left,
      slot: m.slot,
      index: nearestIndex(x),
      startX: e.clientX,
    };
    setPressed(true);
    setBubbleX(x);
    pillRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.touching) return;
    if (Math.abs(e.clientX - d.startX) > 6) d.moved = true;
    const x = xFromClient(e.clientX, { left: d.left, slot: d.slot });
    d.index = nearestIndex(x);
    setBubbleX(x);
  };

  const endPointer = (e) => {
    const d = dragRef.current;
    if (!d.touching) return;
    d.touching = false;
    setPressed(false);
    const idx = d.index;
    setBubbleX(idx);
    const tab = TABS[idx];
    if (tab) onSelect?.(tab.path);
    try {
      pillRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const transform = `translate3d(${bubbleX * 100}%, 0, 0)`;

  return (
    <nav className="dock" aria-label="Navigation">
      <Glass
        className="dock-pill"
        highlight={false}
        colors={{
          bgIos: "bg-ios-dark-glass",
          shadowIos: "shadow-ios-dark-glass",
        }}
        ref={pillRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <span
          className={`dock-bubble${pressed ? " is-dragging" : ""}`}
          style={{
            transform,
            transition: pressed
              ? "none"
              : "transform 0.36s cubic-bezier(0.22, 1.15, 0.36, 1), top 0.28s ease, bottom 0.28s ease, box-shadow 0.28s ease, background 0.28s ease, backdrop-filter 0.28s ease",
          }}
          aria-hidden
        />

        {TABS.map((tab, index) => {
          const underLens = index === highlightIndex;
          const Glyph = underLens ? tab.iconActive : tab.icon;
          return (
            <button
              key={tab.path}
              type="button"
              className={`dock-item${underLens ? " is-active" : ""}`}
              aria-current={index === activeIndex ? "page" : undefined}
              style={underLens ? { color: BLUE } : undefined}
              onClick={(e) => {
                if (dragRef.current.moved) {
                  e.preventDefault();
                  return;
                }
                onSelect?.(tab.path);
                setBubbleX(index);
              }}
            >
              <span className="dock-icon">
                <Icon
                  ios={<Glyph className="w-6 h-6" />}
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
