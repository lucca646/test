import { useEffect, useMemo, useRef, useState } from "react";

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

/**
 * Navbar Liquid Glass (App Store style).
 *
 * @param {object} props
 * @param {{ id: string, label: string, icon: import('react').ReactNode, iconActive?: import('react').ReactNode }[]} props.items
 * @param {string} props.activeId
 * @param {(id: string) => void} [props.onChange]
 * @param {string} [props.activeColor="#0a84ff"]
 * @param {string} [props.className]
 * @param {string} [props.ariaLabel="Navigation"]
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

  const nearestIndex = (x) => clamp(Math.round(x), 0, count - 1);
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
      slot: rect.width / count,
    };
  };

  const xFromClient = (clientX, m) =>
    clamp((clientX - m.left) / m.slot - 0.5, 0, count - 1);

  const morphFromFinger = (vel, clientY, m) => {
    const v = clamp(vel, -1.8, 1.8);
    const stretch = clamp(Math.abs(v) * 0.1, 0, 0.16);
    const midY = m.top + m.height / 2;
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
    const tab = items[idx];
    if (tab) onChange?.(tab.id);
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
    <nav
      className={`lgn ${className}`.trim()}
      aria-label={ariaLabel}
      style={{ "--lgn-count": count, "--lgn-active": activeColor }}
    >
      <div
        className="lgn-pill"
        ref={pillRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
      >
        <span
          className={`lgn-bubble${pressed ? " is-dragging" : ""}`}
          style={{
            transform,
            transition: pressed
              ? "none"
              : "transform 0.36s cubic-bezier(0.22, 1.15, 0.36, 1), top 0.28s ease, bottom 0.28s ease, box-shadow 0.28s ease, background 0.28s ease",
          }}
          aria-hidden
        />

        {items.map((tab, index) => {
          const underLens = index === highlightIndex;
          const glyph = underLens && tab.iconActive != null ? tab.iconActive : tab.icon;
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
}
