import { useEffect, useMemo, useRef, useState } from "react";
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
  const pillRef = useRef(null);
  const dragRef = useRef({
    touching: false,
    moved: false,
    width: 0,
    left: 0,
    index: 0,
  });

  const activeIndex = useMemo(() => {
    const idx = TABS.findIndex((tab) => isActive(activePath, tab.path));
    return idx < 0 ? 0 : idx;
  }, [activePath]);

  const [bubbleX, setBubbleX] = useState(activeIndex);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!dragRef.current.touching) setBubbleX(activeIndex);
  }, [activeIndex]);

  const measure = () => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { width: rect.width, left: rect.left, slot: rect.width / TABS.length };
  };

  const xFromClient = (clientX, m) => {
    const raw = (clientX - m.left) / m.slot - 0.5;
    return Math.max(0, Math.min(TABS.length - 1, raw));
  };

  const nearestIndex = (x) => Math.max(0, Math.min(TABS.length - 1, Math.round(x)));

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    const x = xFromClient(e.clientX, m);
    dragRef.current = {
      touching: true,
      moved: false,
      width: m.width,
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
    const x = xFromClient(e.clientX, d);
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

  return (
    <nav className="dock" aria-label="Navigation">
      <Glass
        className={`dock-pill${pressed ? " is-pressed" : ""}`}
        highlight={false}
        colors={{
          bgIos: "bg-white/18 dark:bg-white/[0.12]",
          shadowIos: "shadow-ios-dark-glass",
        }}
        ref={pillRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <span
          className={`dock-bubble${pressed ? " is-pressed" : ""}`}
          style={{
            transform: `translate3d(${bubbleX * 100}%, 0, 0)`,
            transition: pressed
              ? "none"
              : "transform 0.38s cubic-bezier(0.22, 1.35, 0.36, 1)",
          }}
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
              onClick={(e) => {
                // Si on a draggé, le pointerup a déjà navigué
                if (dragRef.current.moved) {
                  e.preventDefault();
                  return;
                }
                onSelect?.(tab.path);
              }}
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
