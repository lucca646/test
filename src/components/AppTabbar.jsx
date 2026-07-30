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
    top: 0,
    height: 0,
    slot: 0,
    index: 0,
    startX: 0,
    lastX: 0,
    lastT: 0,
    vel: 0,
  });

  const activeIndex = useMemo(() => {
    const idx = TABS.findIndex((tab) => isActive(activePath, tab.path));
    return idx < 0 ? 0 : idx;
  }, [activePath]);

  const [bubbleX, setBubbleX] = useState(activeIndex);
  const [pressed, setPressed] = useState(false);
  /** Déformation légère (doigt) — centre Y reste fixe */
  const [morph, setMorph] = useState({ sx: 1, sy: 1, skew: 0 });

  const highlightIndex = nearestIndex(bubbleX);

  useEffect(() => {
    if (dragRef.current.touching) return;
    setBubbleX(activeIndex);
    setMorph({ sx: 1, sy: 1, skew: 0 });
  }, [activeIndex]);

  const measure = () => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      height: rect.height,
      slot: rect.width / TAB_COUNT,
    };
  };

  const xFromClient = (clientX, m) =>
    clamp((clientX - m.left) / m.slot - 0.5, 0, TAB_COUNT - 1);

  /** Squash / stretch / skew selon vélocité + position Y du doigt */
  const morphFromFinger = (vel, clientY, m) => {
    const v = clamp(vel, -1.8, 1.8);
    const stretch = clamp(Math.abs(v) * 0.1, 0, 0.16);
    const midY = m.top + m.height / 2;
    // Doigt au-dessus → un peu plus haute / étroite ; en-dessous → inverse
    const yPull = clamp((clientY - midY) / (m.height * 0.9), -1, 1);
    const sx = 1 + stretch - yPull * 0.04;
    const sy = 1 - stretch * 0.5 + Math.abs(yPull) * 0.06;
    const skew = clamp(v * 3.2 + yPull * 1.2, -7, 7);
    return {
      sx: clamp(sx, 0.9, 1.18),
      sy: clamp(sy, 0.9, 1.14),
      skew,
    };
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    const x = xFromClient(e.clientX, m);
    const now = performance.now();
    dragRef.current = {
      touching: true,
      moved: false,
      left: m.left,
      top: m.top,
      height: m.height,
      slot: m.slot,
      index: nearestIndex(x),
      startX: e.clientX,
      lastX: e.clientX,
      lastT: now,
      vel: 0,
    };
    setPressed(true);
    setBubbleX(x);
    setMorph({ sx: 1.04, sy: 1.02, skew: 0 });
    pillRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.touching) return;
    if (Math.abs(e.clientX - d.startX) > 6) d.moved = true;

    const now = performance.now();
    const dt = Math.max(8, now - d.lastT);
    const rawVel = (e.clientX - d.lastX) / dt;
    d.vel = d.vel * 0.55 + rawVel * 0.45;
    d.lastX = e.clientX;
    d.lastT = now;

    const m = { left: d.left, slot: d.slot, top: d.top, height: d.height };
    const x = xFromClient(e.clientX, m);
    d.index = nearestIndex(x);
    setBubbleX(x);
    setMorph(morphFromFinger(d.vel * 14, e.clientY, m));
  };

  const endPointer = (e) => {
    const d = dragRef.current;
    if (!d.touching) return;
    d.touching = false;
    setPressed(false);
    const idx = d.index;
    setBubbleX(idx);
    setMorph({ sx: 1, sy: 1, skew: 0 });
    const tab = TABS[idx];
    if (tab) onSelect?.(tab.path);
    try {
      pillRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const transform = pressed
    ? `translate3d(${bubbleX * 100}%, 0, 0) scale(${morph.sx}, ${morph.sy}) skewX(${morph.skew}deg)`
    : `translate3d(${bubbleX * 100}%, 0, 0) scale(1, 1) skewX(0deg)`;

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
              : "transform 0.36s cubic-bezier(0.22, 1.15, 0.36, 1), top 0.28s ease, bottom 0.28s ease, box-shadow 0.28s ease, background 0.28s ease",
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
