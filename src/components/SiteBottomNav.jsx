import { tabsBySide, getCapabilities } from "app-nav";
import { resolveF7Icons } from "../nav/f7IconMap.js";

function NavItem({ tab, activePath, onSelect, showBadge, promoted }) {
  const on =
    tab.path === "/"
      ? activePath === "/"
      : activePath.startsWith(tab.path.replace(/\/$/, ""));
  const { Default, Active } = resolveF7Icons(tab);
  const Icon = on ? Active : Default;

  return (
    <button
      type="button"
      className={`wa-bottom-item${on ? " is-on" : ""}${promoted ? " is-promoted is-camera" : ""}`}
      aria-current={on ? "page" : undefined}
      aria-label={promoted ? tab.label : undefined}
      onClick={() => onSelect(tab.path)}
    >
      <span className="wa-bottom-icon" aria-hidden>
        <Icon />
        {showBadge && tab.badge ? (
          <span className="wa-bottom-badge">{tab.badge}</span>
        ) : null}
      </span>
      {promoted ? null : (
        <span className="wa-bottom-label">{tab.short || tab.label}</span>
      )}
    </button>
  );
}

/**
 * Barre BeReal-like : G / caméra blanche centrale / D.
 */
export default function SiteBottomNav({ activePath, onSelect }) {
  const { left, center, right } = tabsBySide();
  const caps = getCapabilities("web-live");
  const showBadge = Boolean(caps?.badge);
  const promoteCenter = caps?.centerPromoted !== false;

  return (
    <nav className="wa-bottom-nav" aria-label="Navigation">
      <div className="wa-bottom-group" style={{ "--nav-count": left.length }}>
        {left.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
            showBadge={showBadge}
          />
        ))}
      </div>

      {center.length > 0 ? (
        <div className="wa-bottom-center">
          {center.map((tab) => (
            <NavItem
              key={tab.id}
              tab={tab}
              activePath={activePath}
              onSelect={onSelect}
              showBadge={false}
              promoted={promoteCenter}
            />
          ))}
        </div>
      ) : null}

      <div className="wa-bottom-group" style={{ "--nav-count": right.length }}>
        {right.map((tab) => (
          <NavItem
            key={tab.id}
            tab={tab}
            activePath={activePath}
            onSelect={onSelect}
            showBadge={showBadge}
          />
        ))}
      </div>
    </nav>
  );
}
