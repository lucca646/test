import { LiquidGlassNav } from "liquid-glass-nav";
import { visibleTabs, getCapabilities, iconPair } from "app-nav";
import { resolveF7Icons } from "../nav/f7IconMap.js";
import { usePlatform } from "../platform/PlatformContext.jsx";

/** Items lab — icônes selon capabilities de la plateforme. */
function itemsFromSharedNav(platform) {
  const caps = getCapabilities(
    platform === "android"
      ? "web-lab-android"
      : platform === "web"
        ? "web-lab-web"
        : "web-lab-ios",
  );
  const iconSet = caps?.icons || "f7";

  return visibleTabs().map((tab) => {
    if (iconSet === "ion") {
      const pair = iconPair(tab, "ion");
      // Lab Android : on garde un rendu texte/glyph via data-attr (pas de RN Ionicons dans Vite)
      return {
        id: tab.path,
        label: tab.label,
        short: tab.short,
        badge: tab.badge,
        icon: (
          <span className="m3-ion" data-ion={pair.default} aria-hidden>
            ◆
          </span>
        ),
        iconActive: (
          <span className="m3-ion is-on" data-ion={pair.active} aria-hidden>
            ◆
          </span>
        ),
      };
    }

    const { Default, Active } = resolveF7Icons(tab);
    return {
      id: tab.path,
      label: tab.label,
      short: tab.short,
      badge: tab.badge,
      icon: <Default className="w-6 h-6" />,
      iconActive: <Active className="w-6 h-6" />,
    };
  });
}

/** Chrome lab — chaque plateforme interprète le même catalogue. */
export default function AppTabbar({ activePath, onSelect }) {
  const { platform, meta } = usePlatform();
  const items = itemsFromSharedNav(platform);

  if (platform === "android") {
    return (
      <nav
        className="m3-nav"
        aria-label="Navigation Android"
        style={{ "--nav-count": items.length }}
      >
        {items.map((tab) => {
          const on =
            tab.id === "/"
              ? activePath === "/"
              : activePath.startsWith(tab.id.replace(/\/$/, ""));
          return (
            <button
              key={tab.id}
              type="button"
              className={`m3-nav-item${on ? " is-on" : ""}`}
              aria-current={on ? "page" : undefined}
              onClick={() => onSelect(tab.id)}
            >
              <span className="m3-nav-indicator" aria-hidden />
              <span className="m3-nav-icon">{on ? tab.iconActive : tab.icon}</span>
              <span className="m3-nav-label">{tab.short}</span>
            </button>
          );
        })}
      </nav>
    );
  }

  if (platform === "web") {
    return (
      <nav className="web-nav" aria-label="Navigation Web">
        <div className="web-nav-brand">Liquid Glass</div>
        <div className="web-nav-tabs">
          {items.map((tab) => {
            const on =
              tab.id === "/"
                ? activePath === "/"
                : activePath.startsWith(tab.id.replace(/\/$/, ""));
            return (
              <button
                key={tab.id}
                type="button"
                className={`web-nav-tab${on ? " is-on" : ""}`}
                aria-current={on ? "page" : undefined}
                onClick={() => onSelect(tab.id)}
              >
                <span className="web-nav-icon">{on ? tab.iconActive : tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <LiquidGlassNav
      items={items}
      activeId={activePath}
      onChange={onSelect}
      activeColor={meta.accent}
    />
  );
}
