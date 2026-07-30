import { useMemo, useRef, useState } from "react";
import LiquidGlass from "liquid-glass-react";
import { Glass } from "@samasante/liquid-glass";
import { LiquidGlass as CssLiquidGlass } from "@dpawlikowski/liquid-glass/react";
import "@dpawlikowski/liquid-glass/css";
import GlassDock from "./GlassDock.jsx";
import { LiquidGlassFilters } from "./LiquidGlassFilter.jsx";

const LIBS = [
  {
    id: "rdev",
    name: "liquid-glass-react",
    repo: "rdev/liquid-glass-react",
    note: "Le plus populaire — élasticité + modes polar/shader",
  },
  {
    id: "samasante",
    name: "@samasante/liquid-glass",
    repo: "samasante/liquid-glass",
    note: "Headless, cross-browser (copie / live DOM)",
  },
  {
    id: "dpawlikowski",
    name: "@dpawlikowski/liquid-glass",
    repo: "dpawlikowski/liquid-glass",
    note: "CSS + SVG pur, presets subtle/vivid/vision",
  },
  {
    id: "custom",
    name: "SDF maison",
    repo: "local",
    note: "Maps SDF + backdrop-filter url(#filter)",
  },
];

const MENU = [
  { icon: "★", label: "Favoris", meta: "12" },
  { icon: "◎", label: "Aujourd'hui", meta: "3" },
  { icon: "✦", label: "Arcade", meta: "New" },
  { icon: "⌕", label: "Recherche", meta: "" },
  { icon: "⚙", label: "Réglages", meta: "" },
];

const CHIPS = ["Tout", "UI", "Nav", "Form", "Media", "iOS 26"];

function RdevGlass({ children, className = "", style, ...props }) {
  return (
    <LiquidGlass className={className} style={style} {...props}>
      {children}
    </LiquidGlass>
  );
}

function PlayButtons({ stageRef, log }) {
  return (
    <div className="row wrap">
      <RdevGlass
        mouseContainer={stageRef}
        displacementScale={64}
        blurAmount={0.08}
        saturation={140}
        aberrationIntensity={2}
        elasticity={0.35}
        cornerRadius={999}
        padding="12px 22px"
        onClick={() => log("Primary")}
      >
        <span className="btn-label">Primary</span>
      </RdevGlass>

      <RdevGlass
        mouseContainer={stageRef}
        displacementScale={48}
        blurAmount={0.1}
        elasticity={0.28}
        cornerRadius={999}
        padding="12px 22px"
        mode="polar"
        onClick={() => log("Polar")}
      >
        <span className="btn-label">Polar mode</span>
      </RdevGlass>

      <RdevGlass
        mouseContainer={stageRef}
        displacementScale={70}
        blurAmount={0.06}
        elasticity={0.4}
        cornerRadius={18}
        padding="12px 18px"
        mode="prominent"
        onClick={() => log("Prominent")}
      >
        <span className="btn-label">Prominent</span>
      </RdevGlass>

      <RdevGlass
        mouseContainer={stageRef}
        displacementScale={56}
        blurAmount={0.09}
        elasticity={0.3}
        cornerRadius={999}
        padding="12px 14px"
        onClick={() => log("Icon")}
      >
        <span className="btn-label btn-label--icon" aria-label="Ajouter">
          ＋
        </span>
      </RdevGlass>

      <Glass
        className="sama-btn"
        style={{
          background: "rgba(255,255,255,0.16)",
          borderRadius: 999,
          padding: "12px 22px",
        }}
        optics={{ depth: 0.85, curvature: 0.4, dispersion: 0.28, frost: 1.2 }}
      >
        <button type="button" className="naked" onClick={() => log("Samasante")}>
          Samasante Glass
        </button>
      </Glass>

      <CssLiquidGlass intensity="vivid" className="css-btn" style={{ "--lg-radius": "999px" }}>
        <button type="button" className="naked" onClick={() => log("CSS vivid")}>
          CSS vivid
        </button>
      </CssLiquidGlass>
    </div>
  );
}

function PlaySegments({ value, onChange, stageRef }) {
  const items = ["Jour", "Semaine", "Mois"];
  return (
    <RdevGlass
      mouseContainer={stageRef}
      displacementScale={40}
      blurAmount={0.1}
      elasticity={0.2}
      cornerRadius={16}
      padding="6px"
    >
      <div className="segment" role="tablist" aria-label="Période">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={value === item}
            className={`segment-item${value === item ? " is-active" : ""}`}
            onClick={() => onChange(item)}
          >
            {item}
          </button>
        ))}
      </div>
    </RdevGlass>
  );
}

function PlayToggle({ on, onToggle }) {
  return (
    <button
      type="button"
      className={`toggle${on ? " is-on" : ""}`}
      aria-pressed={on}
      onClick={onToggle}
    >
      <Glass
        className="toggle-thumb"
        size={[34, 34]}
        radius={17}
        center={{ x: on ? 1 : 0 }}
        optics={{ depth: 1, curvature: 0.45, dispersion: 0.25, frost: 0.8 }}
        style={{ background: "rgba(255,255,255,0.35)", borderRadius: 999 }}
      >
        <span className="sr-only">{on ? "On" : "Off"}</span>
      </Glass>
    </button>
  );
}

function PlayList({ active, onSelect, stageRef }) {
  return (
    <RdevGlass
      mouseContainer={stageRef}
      displacementScale={36}
      blurAmount={0.12}
      saturation={130}
      aberrationIntensity={1.5}
      elasticity={0.12}
      cornerRadius={24}
      padding="8px"
      style={{ width: "100%", maxWidth: 360 }}
    >
      <ul className="menu-list">
        {MENU.map((item) => (
          <li key={item.label}>
            <button
              type="button"
              className={`menu-item${active === item.label ? " is-active" : ""}`}
              onClick={() => onSelect(item.label)}
            >
              <span className="menu-icon" aria-hidden>
                {item.icon}
              </span>
              <span className="menu-label">{item.label}</span>
              {item.meta ? <span className="menu-meta">{item.meta}</span> : null}
            </button>
          </li>
        ))}
      </ul>
    </RdevGlass>
  );
}

function PlayChips({ value, onChange, stageRef }) {
  return (
    <div className="row wrap">
      {CHIPS.map((chip) => (
        <RdevGlass
          key={chip}
          mouseContainer={stageRef}
          displacementScale={value === chip ? 54 : 28}
          blurAmount={0.08}
          elasticity={0.25}
          cornerRadius={999}
          padding="8px 14px"
          onClick={() => onChange(chip)}
        >
          <span className={`chip${value === chip ? " is-active" : ""}`}>{chip}</span>
        </RdevGlass>
      ))}
    </div>
  );
}

function PlayInputs({ stageRef, query, setQuery }) {
  return (
    <div className="stack">
      <RdevGlass
        mouseContainer={stageRef}
        displacementScale={30}
        blurAmount={0.14}
        elasticity={0.08}
        cornerRadius={18}
        padding="0"
        style={{ width: "100%", maxWidth: 420 }}
      >
        <label className="field">
          <span className="field-icon" aria-hidden>
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un composant…"
          />
        </label>
      </RdevGlass>

      <CssLiquidGlass intensity="subtle" className="css-card" style={{ "--lg-radius": "18px" }}>
        <label className="field field--stack">
          <span>Nom</span>
          <input defaultValue="COR·ALT" />
        </label>
      </CssLiquidGlass>
    </div>
  );
}

function PlayCards({ stageRef }) {
  return (
    <div className="cards-grid">
      <RdevGlass
        mouseContainer={stageRef}
        displacementScale={50}
        blurAmount={0.1}
        elasticity={0.18}
        cornerRadius={28}
        padding="20px"
        mode="standard"
      >
        <article className="glass-card">
          <h3>Carte rdev</h3>
          <p>Refraction + élasticité au survol du stage.</p>
        </article>
      </RdevGlass>

      <Glass
        className="sama-card"
        style={{
          background: "rgba(255,255,255,0.12)",
          borderRadius: 28,
          padding: 20,
          minHeight: 140,
        }}
        optics={{ depth: 0.9, curvature: 0.35, dispersion: 0.22, frost: 1.4, sheen: 0.7 }}
      >
        <article className="glass-card">
          <h3>Carte Samasante</h3>
          <p>Material headless, optics configurables.</p>
        </article>
      </Glass>

      <CssLiquidGlass intensity="vision" className="css-card" style={{ "--lg-radius": "28px" }}>
        <article className="glass-card">
          <h3>Carte CSS vision</h3>
          <p>Preset visionOS via @dpawlikowski.</p>
        </article>
      </CssLiquidGlass>
    </div>
  );
}

function PlaySlider({ value, onChange }) {
  return (
    <div className="slider-wrap">
      <div className="slider-track" aria-hidden>
        <div className="slider-fill" style={{ width: `${value}%` }} />
      </div>
      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Intensité"
      />
      <div className="slider-thumb" style={{ left: `calc(${value}% - 22px)` }}>
        <Glass
          size={[44, 44]}
          radius={22}
          optics={{ depth: 0.7, curvature: 0.5, dispersion: 0.3, frost: 0.6 }}
          style={{ background: "rgba(255,255,255,0.28)", borderRadius: 999 }}
        >
          <span className="slider-value">{value}</span>
        </Glass>
      </div>
    </div>
  );
}

export default function App() {
  const stageRef = useRef(null);
  const [lib, setLib] = useState("rdev");
  const [tab, setTab] = useState("arcade");
  const [segment, setSegment] = useState("Semaine");
  const [listActive, setListActive] = useState("Arcade");
  const [chip, setChip] = useState("UI");
  const [on, setOn] = useState(true);
  const [query, setQuery] = useState("");
  const [intensity, setIntensity] = useState(64);
  const [logs, setLogs] = useState([]);

  const log = (label) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} — ${label}`, ...prev].slice(0, 8));
  };

  const activeLib = useMemo(() => LIBS.find((l) => l.id === lib) || LIBS[0], [lib]);

  return (
    <>
      <LiquidGlassFilters />
      <div className="app" ref={stageRef}>
        <div className="bg-blobs" aria-hidden />

        <header className="hero">
          <p className="eyebrow">Playground · lucca646/test</p>
          <h1>Liquid Glass Kit</h1>
          <p className="lede">
            Boutons, listes, toggles, chips, inputs, cards, dock — branchés sur les
            meilleurs plugins Git/npm.
          </p>

          <div className="lib-switch" role="tablist" aria-label="Bibliothèque">
            {LIBS.map((item) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={lib === item.id}
                className={`lib-chip${lib === item.id ? " is-active" : ""}`}
                onClick={() => setLib(item.id)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <p className="lib-note">
            <strong>{activeLib.name}</strong> — {activeLib.note}
            {activeLib.repo !== "local" ? (
              <>
                {" "}
                ·{" "}
                <a href={`https://github.com/${activeLib.repo}`} target="_blank" rel="noreferrer">
                  {activeLib.repo}
                </a>
              </>
            ) : null}
          </p>
        </header>

        <main className="playground">
          <section className="panel">
            <div className="panel-head">
              <h2>Boutons</h2>
              <span>rdev · samasante · css</span>
            </div>
            <PlayButtons stageRef={stageRef} log={log} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Segmented + Toggle</h2>
              <span>
                {segment} · {on ? "ON" : "OFF"}
              </span>
            </div>
            <div className="row between">
              <PlaySegments value={segment} onChange={setSegment} stageRef={stageRef} />
              <PlayToggle on={on} onToggle={() => setOn((v) => !v)} />
            </div>
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Liste / menu</h2>
              <span>{listActive}</span>
            </div>
            <PlayList active={listActive} onSelect={setListActive} stageRef={stageRef} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Chips / filtres</h2>
              <span>{chip}</span>
            </div>
            <PlayChips value={chip} onChange={setChip} stageRef={stageRef} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Inputs</h2>
              <span>{query || "vide"}</span>
            </div>
            <PlayInputs stageRef={stageRef} query={query} setQuery={setQuery} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Cards</h2>
              <span>3 libs côte à côte</span>
            </div>
            <PlayCards stageRef={stageRef} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Slider lentille</h2>
              <span>{intensity}</span>
            </div>
            <PlaySlider value={intensity} onChange={setIntensity} />
          </section>

          <section className="panel">
            <div className="panel-head">
              <h2>Event log</h2>
              <button type="button" className="text-btn" onClick={() => setLogs([])}>
                Clear
              </button>
            </div>
            <CssLiquidGlass intensity="subtle" className="css-card log-card">
              {logs.length === 0 ? (
                <p className="muted">Clique un bouton pour logger.</p>
              ) : (
                <ul className="log-list">
                  {logs.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
            </CssLiquidGlass>
          </section>

          <section className="panel panel--wide">
            <div className="panel-head">
              <h2>Libs installées</h2>
            </div>
            <div className="repo-grid">
              {LIBS.filter((l) => l.repo !== "local").map((item) => (
                <a
                  key={item.id}
                  className="repo-card"
                  href={`https://github.com/${item.repo}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <strong>{item.name}</strong>
                  <span>{item.repo}</span>
                  <p>{item.note}</p>
                </a>
              ))}
            </div>
          </section>
        </main>

        <GlassDock activeId={tab} onChange={setTab} />
      </div>
    </>
  );
}
