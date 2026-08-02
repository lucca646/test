import { tabsBySide, getCapabilities } from "app-nav";
import { resolveF7Icons } from "../nav/f7IconMap.js";

function NavItem({ tab, activePath, onSelect, showBadge }) {
  const on =
    tab.path === "/"
      ? activePath === "/"
      : activePath.startsWith(tab.path.replace(/\/$/, ""));
  const { Default, Active } = resolveF7Icons(tab);
  const Icon = on ? Active : Default;

  return (
    <button
      type="button"
      className={`wa-bottom-item${on ? " is-on" : ""}`}
      aria-current={on ? "page" : undefined}
      onClick={() => onSelect(tab.path)}
    >
      <span className="wa-bottom-icon" aria-hidden>
        <Icon />
        {showBadge && tab.badge ? (
          <span className="wa-bottom-badge">{tab.badge}</span>
        ) : null}
      </span>
      <span className="wa-bottom-label">{tab.short || tab.label}</span>
    </button>
  );
}

/**
 * Barre bas web split — interprète app-nav.side via capabilities web-live.
 */
export default function SiteBottomNav({ activePath, onSelect }) {
  const { left, right } = tabsBySide();
  const caps = getCapabilities("web-live");

  return (
    <nav className="wa-bottom-nav" aria-label="Navigation">
      <div className="wa-bottom-group" style={{ "--nav-count": left.length }}>
        {left.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
            showBadge={Boolean(caps?.badge)}
          />
        ))}
      </div>
      <div className="wa-bottom-group" style={{ "--nav-count": right.length }}>
        {right.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
            showBadge={Boolean(caps?.badge)}
          />
        ))}
      </div>
    </nav>
  );
}
