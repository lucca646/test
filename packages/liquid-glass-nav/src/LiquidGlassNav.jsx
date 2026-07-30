import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Glass } from "@samasante/liquid-glass";

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function matchActive(activeId, itemId) {
  if (itemId === "/" || itemId === "") {
    return activeId === "/" || activeId === "" || activeId == null;
  }
  const clean = String(itemId).replace(/\/$/, "");
  const active = String(activeId ?? "");
  return (
    active === itemId ||
    active === clean ||
    active.startsWith(`${clean}/`)
  );
}

/** Repos : verre discret, peu de distorsion */
const OPTICS_REST = {
  depth: 0.28,
  curvature: 0.18,
  bend: 0.12,
  bendWidth: 0.12,
  strength: 0.06,
  frost: 0,
  dispersion: 0.04,
  specular: 0.45,
  sheen: 0.28,
  sheenWidth: 2,
  brightness: 0.05,
  softEdge: true,
  clipToShape: true,
  mapSize: 256,
  saturate: 1.1,
  glow: 0.06,
  glowSpread: 0.18,
  glowFalloff: 2,
  sheenAngle: 125,
  sheenDark: false,
  sheenFalloff: 2,
  splay: 0.04,
};

/** Drag : loupe transparente + distorsion du fond (sans fish-eye agressif) */
const OPTICS_DRAG = {
  depth: 0.78,
  curvature: 0.55,
  bend: 0.48,
  bendWidth: 0.15,
  strength: 0.36,
  frost: 0,
  dispersion: 0.22,
  specular: 0.75,
  sheen: 0.45,
  sheenWidth: 2.2,
  brightness: 0.015,
  softEdge: true,
  clipToShape: true,
  mapSize: 320,
  saturate: 1.2,
  glow: 0.12,
  glowSpread: 0.2,
  glowFalloff: 2,
  sheenAngle: 125,
  sheenDark: false,
  sheenFalloff: 2,
  splay: 0.08,
};

/**
 * Navbar Liquid Glass (App Store style).
 * Pastille CSS positionnée + Glass pour la distorsion du fond.
 */
export default function LiquidGlassNav({
  items = [],
  activeId,
  onChange,
  activeColor = "#0a84ff",
  className = "",
  ariaLabel = "Navigation",
}) {
  const count = Math.max(items.length, 1);
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
    const idx = items.findIndex((tab) => matchActive(activeId, tab.id));
    return idx < 0 ? 0 : idx;
  }, [activeId, items]);

  const [bubbleX, setBubbleX] = useState(activeIndex);
  const [pressed, setPressed] = useState(false);
  const [morph, setMorph] = useState({ sx: 1, sy: 1, skew: 0 });
  const [lensPx, setLensPx] = useState({ w: 72, h: 42 });
  const [mounted, setMounted] = useState(false);

  const nearestIndex = (x) => clamp(Math.round(x), 0, count - 1);
  const highlightIndex = nearestIndex(bubbleX);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (dragRef.current.touching) return;
    setBubbleX(activeIndex);
    setMorph({ sx: 1, sy: 1, skew: 0 });
  }, [activeIndex]);

  useLayoutEffect(() => {
    const el = pillRef.current;
    if (!el) return;

    const measureLens = () => {
      const rect = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const padX = parseFloat(cs.paddingLeft) || 5.6;
      const padT = parseFloat(cs.paddingTop) || 5.6;
      const padB = parseFloat(cs.paddingBottom) || 5.6;
      const slot = (rect.width - padX * 2) / count;
      const iconZone = Math.max(36, rect.height - padT - padB);
      /* repos inset 0.5rem ; drag overflow 0.28rem — largeur inchangée */
      const inset = pressed ? -0.28 * 16 : 0.5 * 16;
      const h = Math.max(30, iconZone - inset * 2);
      setLensPx({ w: Math.max(40, slot), h });
    };

    measureLens();
    const ro =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(measureLens) : null;
    ro?.observe(el);
    window.addEventListener("resize", measureLens);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", measureLens);
    };
  }, [count, pressed]);

  const measure = () => {
    const el = pillRef.current;
    if (!el) return null;
    const rect = el.getBoundingClientRect();
    return {
      left: rect.left,
      top: rect.top,
      height: rect.height,
      slot: rect.width / count,
    };
  };

  const xFromClient = (clientX, m) =>
    clamp((clientX - m.left) / m.slot - 0.5, 0, count - 1);

  const morphFromFinger = (vel, clientY, m) => {
    const v = clamp(vel, -1.8, 1.8);
    const stretch = clamp(Math.abs(v) * 0.08, 0, 0.1);
    const midY = m.top + m.height / 2;
    const yPull = clamp((clientY - midY) / (m.height * 0.9), -1, 1);
    const s = 1 + stretch * 0.35 + Math.abs(yPull) * 0.03;
    const skew = clamp(v * 2.2, -5, 5);
    return { sx: clamp(s, 0.96, 1.08), sy: clamp(s, 0.96, 1.08), skew };
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
    setMorph({ sx: 1.04, sy: 1.04, skew: 0 });
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
    const tab = items[idx];
    if (tab) onChange?.(tab.id);
    try {
      pillRef.current?.releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const transform = `translate3d(${bubbleX * 100}%, 0, 0) scale(${morph.sx}, ${morph.sy}) skewX(${morph.skew}deg)`;

  const nav = (
    <nav
      className={`lgn ${className}`.trim()}
      aria-label={ariaLabel}
      style={{
        "--lgn-count": count,
        "--lgn-active": activeColor,
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        top: "auto",
        margin: 0,
        padding: 0,
      }}
    >
      <div
        className={`lgn-pill${pressed ? " is-dragging" : ""}`}
        ref={pillRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <Glass
          className={`lgn-bubble${pressed ? " is-dragging" : ""}`}
          width={lensPx.w}
          height={lensPx.h}
          radius={999}
          optics={pressed ? OPTICS_DRAG : OPTICS_REST}
          behind="transparent"
          style={{
            transform,
            transition: pressed
              ? "none"
              : "transform 0.36s cubic-bezier(0.22, 1.15, 0.36, 1), top 0.22s ease, bottom 0.22s ease",
            background: pressed
              ? "rgba(255,255,255,0.04)"
              : "rgba(255,255,255,0.1)",
          }}
          aria-hidden
        />

        {items.map((tab, index) => {
          const underLens = index === highlightIndex;
          const glyph =
            underLens && tab.iconActive != null ? tab.iconActive : tab.icon;
          return (
            <button
              key={tab.id}
              type="button"
              className={`lgn-item${underLens ? " is-active" : ""}`}
              aria-current={index === activeIndex ? "page" : undefined}
              style={underLens ? { color: activeColor } : undefined}
              onClick={(e) => {
                if (dragRef.current.moved) {
                  e.preventDefault();
                  return;
                }
                onChange?.(tab.id);
                setBubbleX(index);
              }}
            >
              <span className="lgn-icon">{glyph}</span>
              <span className="lgn-label">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );

  if (!mounted || typeof document === "undefined") return null;
  return createPortal(nav, document.body);
}
