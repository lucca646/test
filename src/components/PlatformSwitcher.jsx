import { PLATFORMS, usePlatform } from "../platform/PlatformContext.jsx";

export default function PlatformSwitcher() {
  const { platform, setPlatform, meta } = usePlatform();

  return (
    <div className="platform-switcher">
      <div className="platform-switcher-head">
        <strong>Même base · rendu plateforme</strong>
        <span>{meta.hint}</span>
      </div>
      <div className="platform-switcher-chips" role="tablist" aria-label="Plateforme">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={platform === p.id}
            className={`platform-chip${platform === p.id ? " is-on" : ""}`}
            style={platform === p.id ? { "--chip-accent": p.accent } : undefined}
            onClick={() => setPlatform(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
