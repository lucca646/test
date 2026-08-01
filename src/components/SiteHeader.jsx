import { visibleTabs } from "app-nav";

/**
 * Header site (pas une tabbar d’app).
 */
export default function SiteHeader({ activePath, onSelect }) {
  const tabs = visibleTabs();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <a
          href="/"
          className="site-brand"
          onClick={(e) => {
            e.preventDefault();
            onSelect("/");
          }}
        >
          Coraia
        </a>
        <nav className="site-nav" aria-label="Principal">
          {tabs.map((tab) => {
            const on =
              tab.path === "/"
                ? activePath === "/"
                : activePath.startsWith(tab.path.replace(/\/$/, ""));
            return (
              <a
                key={tab.id}
                href={tab.path}
                className={`site-nav-link${on ? " is-on" : ""}`}
                aria-current={on ? "page" : undefined}
                onClick={(e) => {
                  e.preventDefault();
                  onSelect(tab.path);
                }}
              >
                {tab.label}
              </a>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
