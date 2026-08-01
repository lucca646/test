import { useState, useCallback, useEffect } from "react";
import { App as KonstaApp } from "konsta/react";
import {
  PlatformProvider,
  usePlatform,
} from "./platform/PlatformContext.jsx";
import PlatformSwitcher from "./components/PlatformSwitcher.jsx";
import DeviceFrame from "./components/DeviceFrame.jsx";
import AppTabbar from "./components/AppTabbar.jsx";
import SiteHeader from "./components/SiteHeader.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import GamesPage from "./pages/GamesPage.jsx";
import AppsPage from "./pages/AppsPage.jsx";
import ArcadePage from "./pages/ArcadePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import "./styles/site.css";

const PAGES = {
  "/": TodayPage,
  "/games/": GamesPage,
  "/apps/": AppsPage,
  "/arcade/": ArcadePage,
  "/search/": SearchPage,
};

function normalizePath(path) {
  if (!path || path === "") return "/";
  const map = {
    "/games": "/games/",
    "/apps": "/apps/",
    "/arcade": "/arcade/",
    "/search": "/search/",
    "/settings": "/search/",
    "/settings/": "/search/",
  };
  if (map[path]) return map[path];
  return PAGES[path] ? path : "/";
}

function LiveWebShell() {
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.pathname),
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.dataset.platform = "web";
    document.documentElement.dataset.lab = "0";
  }, []);

  const selectTab = useCallback((path) => {
    const next = normalizePath(path);
    setActivePath(next);
    const url = new URL(window.location.href);
    url.pathname = next === "/" ? "/" : next;
    window.history.replaceState({}, "", url);
  }, []);

  const ActivePage = PAGES[activePath] || TodayPage;

  return (
    <div className="site is-live-web">
      <SiteHeader activePath={activePath} onSelect={selectTab} />
      <main className="site-main">
        <ActivePage
          key={activePath}
          onNavigate={selectTab}
        />
      </main>
      <footer className="site-footer">Coraia · site web</footer>
    </div>
  );
}

function LabShell() {
  const { platform, meta, lab } = usePlatform();
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.pathname),
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.dataset.platform = platform;
    document.documentElement.dataset.lab = "1";
  }, [platform]);

  const selectTab = useCallback((path) => {
    const next = normalizePath(path);
    setActivePath(next);
    const url = new URL(window.location.href);
    url.pathname = next === "/" ? "/" : next;
    window.history.replaceState({}, "", url);
  }, []);

  const ActivePage = PAGES[activePath] || TodayPage;
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
