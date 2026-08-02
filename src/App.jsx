import { useState, useCallback, useEffect } from "react";
import { App as KonstaApp } from "konsta/react";
import {
  PlatformProvider,
  usePlatform,
} from "./platform/PlatformContext.jsx";
import PlatformSwitcher from "./components/PlatformSwitcher.jsx";
import DeviceFrame from "./components/DeviceFrame.jsx";
import AppTabbar from "./components/AppTabbar.jsx";
import { allTabs, normalizeWebPath, visibleTabs } from "app-nav";
import SiteBottomNav from "./components/SiteBottomNav.jsx";
import EntreprisesPage from "./pages/EntreprisesPage.jsx";
import RecherchePage from "./pages/RecherchePage.jsx";
import EnvoisPage from "./pages/EnvoisPage.jsx";
import ParametresPage from "./pages/ParametresPage.jsx";
import "./styles/site.css";

/** Composants host — branchés par id catalogue COR·ALT (pas une 2ᵉ liste de paths). */
const PAGE_BY_ID = {
  entreprises: EntreprisesPage,
  recherche: RecherchePage,
  envois: EnvoisPage,
  parametres: ParametresPage,
};

function pageForPath(path) {
  const tabs = allTabs();
  const normalized = normalizeWebPath(path, tabs);
  const tab = tabs.find((t) => t.path === normalized);
  return {
    path: normalized,
    Page: (tab && PAGE_BY_ID[tab.id]) || EntreprisesPage,
  };
}

function LiveWebShell() {
  const [activePath, setActivePath] = useState(
    () => pageForPath(window.location.pathname).path,
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.dataset.platform = "web";
    document.documentElement.dataset.lab = "0";
  }, []);

  const selectTab = useCallback((path) => {
    const next = pageForPath(path).path;
    setActivePath(next);
    const url = new URL(window.location.href);
    url.pathname = next === "/" ? "/" : next;
    window.history.replaceState({}, "", url);
  }, []);

  const { Page: ActivePage } = pageForPath(activePath);

  return (
    <div
      className="site is-live-web"
      style={{ "--nav-count": visibleTabs().length }}
    >
      <header className="wa-topbar">
        <span className="wa-topbar-brand">COR·ALT</span>
      </header>
      <main className="site-main">
        <ActivePage key={activePath} onNavigate={selectTab} />
      </main>
      <SiteBottomNav activePath={activePath} onSelect={selectTab} />
    </div>
  );
}

function LabShell() {
  const { platform, meta, lab } = usePlatform();
  const [activePath, setActivePath] = useState(
    () => pageForPath(window.location.pathname).path,
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.dataset.platform = platform;
    document.documentElement.dataset.lab = "1";
  }, [platform]);

  const selectTab = useCallback((path) => {
    const next = pageForPath(path).path;
    setActivePath(next);
    const url = new URL(window.location.href);
    url.pathname = next === "/" ? "/" : next;
    window.history.replaceState({}, "", url);
  }, []);

  const { Page: ActivePage } = pageForPath(activePath);
  const nav = <AppTabbar activePath={activePath} onSelect={selectTab} />;

  return (
    <div className={`web-native-shell platform-${platform} is-lab`}>
      {lab ? <PlatformSwitcher /> : null}
      <DeviceFrame nav={nav} liveWeb={false}>
        <KonstaApp
          key={meta.konstaTheme}
          theme={meta.konstaTheme}
          dark
          safeAreas={false}
          className={`ios-shell dark no-safe-areas-bottom theme-${meta.konstaTheme}`}
        >
          <div className="app-wallpaper" aria-hidden data-platform={platform} />
          <main className="tab-stage">
            <ActivePage key={activePath} onNavigate={selectTab} />
          </main>
        </KonstaApp>
      </DeviceFrame>
    </div>
  );
}

function AppShell() {
  const { lab } = usePlatform();
  return lab ? <LabShell /> : <LiveWebShell />;
}

export default function App() {
  return (
    <PlatformProvider>
      <AppShell />
    </PlatformProvider>
  );
}
