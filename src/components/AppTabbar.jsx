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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

export default function AppTabbar({ activePath, onSelect }) {
  const pillRef = useRef(null);
  const dragRef = useRef({
    touching: false,
    moved: false,
    width: 0,
    left: 0,
    index: 0,
    startX: 0,
    lastX: 0,
    lastT: 0,
    vel: 0,
  });
  const rafRef = useRef(0);

  const activeIndex = useMemo(() => {
    const idx = TABS.findIndex((tab) => isActive(activePath, tab.path));
    return idx < 0 ? 0 : idx;
  }, [activePath]);

  const [bubbleX, setBubbleX] = useState(activeIndex);
  const [pressed, setPressed] = useState(false);
  /** Morph liquide : scaleX / scaleY / skewX / offsetY (px) */
  const [morph, setMorph] = useState({ sx: 1, sy: 1, skew: 0, oy: 0 });

  useEffect(() => {
    if (!dragRef.current.touching) {
      setBubbleX(activeIndex);
      setMorph({ sx: 1, sy: 1, skew: 0, oy: 0 });
    }
  }, [activeIndex]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  const measure = () => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return { width: rect.width, left: rect.left, top: rect.top, height: rect.height, slot: rect.width / TABS.length };
  };

  const xFromClient = (clientX, m) => {
    const raw = (clientX - m.left) / m.slot - 0.5;
    return clamp(raw, 0, TABS.length - 1);
  };

  const nearestIndex = (x) => clamp(Math.round(x), 0, TABS.length - 1);

  /** Squash / stretch léger — forme seule, sans flou */
  const morphFromVelocity = (vel, clientY, m) => {
    const v = clamp(vel, -2.2, 2.2);
    const stretch = clamp(Math.abs(v) * 0.09, 0, 0.22);
    const scaleX = 1 + stretch;
    const scaleY = 1 - stretch * 0.45;
    const skew = clamp(v * 2.8, -8, 8);
    let oy = 0;
    if (m) {
      const midY = m.top + m.height / 2;
      oy = clamp((clientY - midY) * 0.22, -6, 6);
    }
    return { sx: scaleX, sy: scaleY, skew, oy };
  };

  const springMorphHome = () => {
    const start = performance.now();
    const from = { ...dragRef.current.morphSnap };
    const tick = (t) => {
      const p = clamp((t - start) / 420, 0, 1);
      const e = 1 - Math.pow(1 - p, 3);
      setMorph({
        sx: from.sx + (1 - from.sx) * e,
        sy: from.sy + (1 - from.sy) * e,
        skew: from.skew * (1 - e),
        oy: from.oy * (1 - e),
      });
      if (p < 1) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  };

  const onPointerDown = (e) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const m = measure();
    if (!m) return;
    cancelAnimationFrame(rafRef.current);
    const x = xFromClient(e.clientX, m);
    const now = performance.now();
    dragRef.current = {
      touching: true,
      moved: false,
      width: m.width,
      left: m.left,
      top: m.top,
      height: m.height,
      slot: m.slot,
      index: nearestIndex(x),
      startX: e.clientX,
      lastX: e.clientX,
      lastT: now,
      vel: 0,
      morphSnap: { sx: 1.04, sy: 0.98, skew: 0, oy: 0 },
    };
    setPressed(true);
    setBubbleX(x);
    setMorph({ sx: 1.05, sy: 0.97, skew: 0, oy: 0 });
    pillRef.current?.setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = dragRef.current;
    if (!d.touching) return;
    if (Math.abs(e.clientX - d.startX) > 6) d.moved = true;

    const now = performance.now();
    const dt = Math.max(8, now - d.lastT);
    const rawVel = (e.clientX - d.lastX) / dt; // px/ms
    d.vel = d.vel * 0.55 + rawVel * 0.45;
    d.lastX = e.clientX;
    d.lastT = now;

    const m = {
      left: d.left,
      slot: d.slot,
      top: d.top,
      height: d.height,
    };
    const x = xFromClient(e.clientX, m);
    d.index = nearestIndex(x);
    setBubbleX(x);

    const nextMorph = morphFromVelocity(d.vel * 16, e.clientY, m);
    d.morphSnap = nextMorph;
    setMorph(nextMorph);
  };

  const endPointer = (e) => {
    const d = dragRef.current;
    if (!d.touching) return;
    d.touching = false;
    setPressed(false);
    const idx = d.index;
    setBubbleX(idx);
    springMorphHome();
    const tab = TABS[idx];
    if (tab) onSelect?.(tab.path);
    try {
      pillRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const transform = pressed
    ? `translate3d(${bubbleX * 100}%, ${morph.oy}px, 0) scale(${morph.sx}, ${morph.sy}) skewX(${morph.skew}deg)`
    : `translate3d(${bubbleX * 100}%, ${morph.oy}px, 0) scale(${morph.sx}, ${morph.sy}) skewX(${morph.skew}deg)`;

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

        <span
          className={`dock-bubble${pressed ? " is-pressed" : ""}`}
          style={{
            transform,
            transition: pressed
              ? "none"
              : "transform 0.42s cubic-bezier(0.22, 1.35, 0.36, 1)",
          }}
          aria-hidden
        />
      </Glass>
    </nav>
  );
}
