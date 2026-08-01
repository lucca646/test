import { useState } from "react";

const DEFAULT_SCRIPT = `mode score
start
wait 1200
phase
wait 600
mode progress
update
wait 900
mode music
update
wait 700
stop
`;

/**
 * REPL : un script → broadcast web + iOS via island-bridge.
 */
export default function IslandBridgePanel({
  status,
  peers,
  onRun,
  connectedHint,
}) {
  const [script, setScript] = useState(DEFAULT_SCRIPT);

  return (
    <section className="di-card" style={{ marginTop: 12 }}>
      <h3 className="di-title">Bridge interprète</h3>
      <p className="di-hint">
        Un seul script JS/DSL pilote la preview web <strong>et</strong> l’île
        iOS (si l’app est connectée au même bridge).
      </p>
      <p className="di-hint" style={{ opacity: 0.85 }}>
        {status}
        {peers > 0 ? ` · ${peers} peer(s)` : ""}
        {connectedHint ? ` · ${connectedHint}` : ""}
      </p>
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        rows={10}
        spellCheck={false}
        className="island-bridge-script"
        aria-label="Script bridge"
      />
      <div className="di-actions" style={{ marginTop: 10 }}>
        <button type="button" className="di-btn di-btn-primary" onClick={() => onRun?.(script)}>
          Run → web + iOS
        </button>
        <button
          type="button"
          className="di-btn"
          onClick={() => setScript(DEFAULT_SCRIPT)}
        >
          Reset exemple
        </button>
      </div>
    </section>
  );
}
