import { useLayoutEffect, useRef, useState } from "react";

const TABS = [
  { id: "today", label: "Aujourd'hui", icon: "◎" },
  { id: "arcade", label: "Arcade", icon: "✦" },
  { id: "search", label: "Recherche", icon: "⌕" },
];

export default function GlassDock({ activeId, onChange }) {
  const navRef = useRef(null);
  const pillRef = useRef(null);
  const [lensX, setLensX] = useState(0);
  const [visible, setVisible] = useState(false);

  useLayoutEffect(() => {
    const nav = navRef.current;
    const pill = pillRef.current;
    if (!nav || !pill) return;

    const update = () => {
      const active = pill.querySelector(`[data-tab="${activeId}"]`);
      if (!active) {
        setVisible(false);
        return;
      }
      const navRect = nav.getBoundingClientRect();
      const itemRect = active.getBoundingClientRect();
      const lensSize = 62;
      setLensX(itemRect.left + itemRect.width / 2 - navRect.left - lensSize / 2);
      setVisible(true);
    };

    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(nav);
    window.addEventListener("resize", update);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [activeId]);

  return (
    <nav
      ref={navRef}
      className="glass-dock"
      aria-label="Navigation"
      style={{ "--lg-lens-x": `${lensX}px` }}
    >
      <div
        className={`glass-lens sdf-glass sdf-glass--blob${visible ? " is-visible" : ""}`}
        aria-hidden="true"
      />
      <div ref={pillRef} className="glass-pill sdf-glass">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            data-tab={tab.id}
            className={`glass-tab${activeId === tab.id ? " is-active" : ""}`}
            onClick={() => onChange(tab.id)}
          >
            <span className="glass-tab-icon" aria-hidden>
              {tab.icon}
            </span>
            <span className="glass-tab-label">{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
