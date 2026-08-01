import { useEffect, useMemo, useRef, useState } from "react";
import "./dynamic-island.css";

const LAYOUT = {
  minimal: { w: 36, h: 36, r: 18, p: 0 },
  compact: { w: 126, h: 36, r: 18, p: 12 },
  timer: { w: 126, h: 36, r: 18, p: 12 },
  music: { w: 300, h: 88, r: 22, p: 14 },
  progress: { w: 312, h: 92, r: 24, p: 14 },
  score: { w: 320, h: 108, r: 28, p: 14 },
  breathe: { w: 200, h: 72, r: 36, p: 14 },
  focus: { w: 300, h: 88, r: 24, p: 14 },
  expanded: { w: 300, h: 88, r: 24, p: 14 },
};

const CONTENT_MODES = [
  "timer",
  "music",
  "progress",
  "score",
  "breathe",
  "focus",
];

const PRESETS = {
  spring: {
    label: "Spring",
    css: "width 420ms cubic-bezier(0.34, 1.4, 0.64, 1), height 420ms cubic-bezier(0.34, 1.4, 0.64, 1), border-radius 420ms cubic-bezier(0.34, 1.4, 0.64, 1), padding 420ms cubic-bezier(0.34, 1.4, 0.64, 1)",
  },
  ease: {
    label: "Ease",
    css: null,
  },
  snappy: {
    label: "Snappy",
    css: "width 220ms cubic-bezier(0.2, 0.9, 0.2, 1), height 220ms cubic-bezier(0.2, 0.9, 0.2, 1), border-radius 220ms cubic-bezier(0.2, 0.9, 0.2, 1), padding 220ms cubic-bezier(0.2, 0.9, 0.2, 1)",
  },
};

/**
 * Miroir web du playground Dynamic Island.
 * `onBind({ dispatch })` expose le même bus que le bridge iOS.
 */
export default function DynamicIslandWeb({ onBind } = {}) {
  const [mode, setMode] = useState("timer");
  const [preset, setPreset] = useState("spring");
  const [durationMs, setDurationMs] = useState(420);
  const [running, setRunning] = useState(false);
  const [tick, setTick] = useState(0);
  const [progress, setProgress] = useState(0.35);
  const [status, setStatus] = useState(
    "Web · prêt pour le bridge interprète (script unique → web + iOS).",
  );
  const [pulse, setPulse] = useState(false);

  const box = LAYOUT[mode] || LAYOUT.compact;

  const apiRef = useRef({});
  apiRef.current = {
    setMode,
    setRunning,
    setTick,
    setProgress,
    setStatus,
    setPulse,
    running,
    mode,
  };

  const transition = useMemo(() => {
    if (preset === "ease") {
      const d = `${durationMs}ms`;
      return `width ${d} cubic-bezier(0.25, 0.1, 0.25, 1), height ${d} cubic-bezier(0.25, 0.1, 0.25, 1), border-radius ${d} cubic-bezier(0.25, 0.1, 0.25, 1), padding ${d} cubic-bezier(0.25, 0.1, 0.25, 1)`;
    }
    if (preset === "spring") {
      const d = `${Math.max(280, durationMs)}ms`;
      const damp = Math.min(1.55, 1.15 + (36 - 16) * 0.01);
      return `width ${d} cubic-bezier(0.34, ${damp}, 0.64, 1), height ${d} cubic-bezier(0.34, ${damp}, 0.64, 1), border-radius ${d} cubic-bezier(0.34, ${damp}, 0.64, 1), padding ${d} cubic-bezier(0.34, ${damp}, 0.64, 1)`;
    }
    return PRESETS.snappy.css;
  }, [preset, durationMs]);

  useEffect(() => {
    if (!pulse) return;
    const t = setTimeout(() => setPulse(false), 360);
    return () => clearTimeout(t);
  }, [pulse]);

  const onStart = () => {
    setRunning(true);
    setTick(0);
    setProgress(0.35);
    setStatus(`Session web démarrée · mode « ${apiRef.current.mode} ».`);
    setPulse(true);
  };

  const onUpdate = () => {
    if (!apiRef.current.running) {
      setStatus("Start d’abord pour simuler les updates.");
      return;
    }
    setTick((n) => {
      const next = n + 1;
      setStatus(`Update #${next} · web`);
      return next;
    });
    setProgress((p) => Math.min(0.95, p + 0.14));
    setPulse(true);
  };

  const onStop = () => {
    setRunning(false);
    setStatus("Session web arrêtée.");
    setPulse(true);
  };

  useEffect(() => {
    if (!onBind) return undefined;
    onBind({
      dispatch(cmd) {
        if (!cmd?.op) return;
        switch (cmd.op) {
          case "mode": {
            const m = String(cmd.mode || "").toLowerCase();
            if (LAYOUT[m] || CONTENT_MODES.includes(m)) {
              setMode(m);
              setStatus(`Bridge · mode « ${m} »`);
              setPulse(true);
            }
            break;
          }
          case "start":
            onStart();
            setStatus("Bridge · start");
            break;
          case "update":
          case "phase":
            onUpdate();
            setStatus(`Bridge · ${cmd.op}`);
            break;
          case "stop":
            onStop();
            break;
          case "echo":
            setStatus(cmd.message || "echo");
            break;
          default:
            break;
        }
      },
    });
    return () => onBind(null);
  }, [onBind]);

  return (
    <section className="di-card">
      <h3 className="di-title">Dynamic Island · web</h3>
      <p className="di-hint">
        Même playground que l’app native. Pilotable par le bridge interprète
        (script unique partagé avec l’iPhone).
      </p>

      <div className="di-stage">
        <div
          className={`di-island${pulse ? " di-pulse" : ""}`}
          style={{
            width: box.w,
            height: box.h,
            borderRadius: box.r,
            padding: box.p,
            maxWidth: "100%",
            transition,
            ["--di-progress"]: `${Math.round(progress * 100)}%`,
          }}
        >
          <IslandBody mode={mode} tick={tick} progress={progress} />
        </div>
      </div>

      <p className="di-group">Animations CSS</p>
      <div className="di-chips">
        {Object.entries(PRESETS).map(([id, meta]) => (
          <button
            key={id}
            type="button"
            className={`di-chip${preset === id ? " is-on" : ""}`}
            onClick={() => setPreset(id)}
          >
            {meta.label}
          </button>
        ))}
      </div>

      <div className="di-slider-label">
        <span>Durée</span>
        <span>{durationMs} ms</span>
      </div>
      <input
        className="di-slider"
        type="range"
        min={120}
        max={1200}
        step={20}
        value={durationMs}
        onChange={(e) => setDurationMs(Number(e.target.value))}
      />

      <p className="di-group">Contenu</p>
      <div className="di-chips">
        {[
          ["timer", "Timer"],
          ["music", "Musique"],
          ["progress", "Livraison"],
          ["score", "Score"],
          ["breathe", "Respirer"],
          ["focus", "Focus"],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            className={`di-chip${mode === id ? " is-on" : ""}`}
            onClick={() => setMode(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="di-actions">
        <button type="button" className="di-btn primary" onClick={onStart}>
          Start
        </button>
        <button type="button" className="di-btn" onClick={onUpdate}>
          Update
        </button>
        <button type="button" className="di-btn danger" onClick={onStop}>
          Stop
        </button>
      </div>

      <div className="di-status">
        <strong>Web · bridge-ready</strong>
        <span>{status}</span>
      </div>
    </section>
  );
}

function IslandBody({ mode, tick, progress }) {
  if (mode === "minimal") {
    return (
      <div className="di-island-inner" style={{ alignItems: "center" }}>
        <span className="di-dot" />
      </div>
    );
  }

  if (mode === "score") {
    const home = 12 + (tick % 9) * 3;
    const away = 10 + ((tick + 3) % 7) * 2;
    return (
      <div className="di-island-inner">
        <div className="di-row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="di-exp-sub">COR</p>
            <p className="di-exp-title" style={{ fontSize: 28 }}>
              {home}
            </p>
          </div>
          <span className="di-trail">vs</span>
          <div style={{ textAlign: "right" }}>
            <p className="di-exp-sub">ALT</p>
            <p className="di-exp-title" style={{ fontSize: 28 }}>
              {away}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "breathe") {
    const phases = ["Inspire", "Retiens", "Expire", "Pause"];
    return (
      <div className="di-island-inner" style={{ alignItems: "center" }}>
        <p className="di-exp-title">{phases[tick % 4]}</p>
      </div>
    );
  }

  if (mode === "focus") {
    return (
      <div className="di-island-inner">
        <p className="di-exp-title">Focus · une tâche</p>
        <p className="di-exp-sub">Session {(tick % 4) + 1}/4</p>
      </div>
    );
  }

  if (mode === "compact" || mode === "timer") {
    return (
      <div className="di-island-inner">
        <div className="di-row">
          <span className="di-lead">{mode === "timer" ? "MIN" : "LG"}</span>
          <span className="di-trail">
            {mode === "timer"
              ? `${String(4 - (tick % 5)).padStart(2, "0")}:${String(59 - (tick % 60)).padStart(2, "0")}`
              : "2:14"}
          </span>
        </div>
      </div>
    );
  }

  if (mode === "music") {
    const titles = ["Liquid Glass", "COR·ALT Live", "Island Drop", "Morph Test"];
    return (
      <div className="di-island-inner">
        <div className="di-row">
          <span className="di-art" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <p className="di-exp-title">{titles[tick % titles.length]}</p>
            <p className="di-exp-sub">COR·ALT · Now Playing</p>
          </div>
          <span className="di-trail">♪</span>
        </div>
      </div>
    );
  }

  if (mode === "progress") {
    const step = (tick % 4) + 1;
    return (
      <div className="di-island-inner">
        <div className="di-row" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="di-exp-sub">ÉTAPE</p>
            <p className="di-exp-title">{step}/4</p>
          </div>
          <div style={{ textAlign: "right" }}>
            <p className="di-exp-sub">ETA</p>
            <p className="di-exp-title">{[18, 12, 4, 1][tick % 4]}'</p>
          </div>
        </div>
        <div className="di-progress">
          <i style={{ width: `${step * 25}%` }} />
        </div>
      </div>
    );
  }

  return (
    <div className="di-island-inner">
      <div className="di-row">
        <span className="di-dot di-live" />
        <div style={{ flex: 1 }}>
          <p className="di-exp-title">Session active</p>
          <p className="di-exp-sub">Expanded · bridge</p>
        </div>
        <span className="di-trail">Web</span>
      </div>
    </div>
  );
}
