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

const BLUE = "#0a84ff";

function isActive(activePath, tabPath) {
  if (tabPath === "/") return activePath === "/" || activePath === "";
  const clean = tabPath.replace(/\/$/, "");
  return activePath === tabPath || activePath.startsWith(`${clean}/`) || activePath === clean;
}

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function nearestIndex(x) {
  return clamp(Math.round(x), 0, TABS.length - 1);
}

export default function AppTabbar({ activePath, onSelect }) {
  const pillRef = useRef(null);
  const growTimer = useRef(0);
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
  const [enlarged, setEnlarged] = useState(false);

  const highlightIndex = nearestIndex(bubbleX);

  useEffect(() => {
    if (dragRef.current.touching) return;
    setBubbleX(activeIndex);
    bumpEnlarge(280);
  }, [activeIndex]);

  useEffect(() => () => clearTimeout(growTimer.current), []);

  function bumpEnlarge(ms) {
    clearTimeout(growTimer.current);
    setEnlarged(true);
    growTimer.current = window.setTimeout(() => setEnlarged(false), ms);
  }

  const measure = () => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { left: rect.left, slot: rect.width / TABS.length };
  };

  const xFromClient = (clientX, m) =>
    clamp((clientX - m.left) / m.slot - 0.5, 0, TABS.length - 1);

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    clearTimeout(growTimer.current);
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
    setEnlarged(true);
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
    bumpEnlarge(300);
    const tab = TABS[idx];
    if (tab) onSelect?.(tab.path);
    try {
      pillRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  // Uniquement X + scale — Y verrouillé (pas de translateY / skew)
  const lensScale = pressed || enlarged ? 1.08 : 0.82;
  const transform = `translate3d(${bubbleX * 100}%, 0, 0) scale(${lensScale})`;

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
          className={`dock-bubble${pressed || enlarged ? " is-enlarged" : ""}`}
          style={{
            transform,
            transition: pressed
              ? "none"
              : "transform 0.38s cubic-bezier(0.22, 1.2, 0.36, 1)",
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
                bumpEnlarge(300);
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
