import { useState, useCallback, useEffect } from "react";
import { App as KonstaApp } from "konsta/react";
import {
  PlatformProvider,
  usePlatform,
} from "./platform/PlatformContext.jsx";
import PlatformSwitcher from "./components/PlatformSwitcher.jsx";
import DeviceFrame from "./components/DeviceFrame.jsx";
import AppTabbar from "./components/AppTabbar.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import GamesPage from "./pages/GamesPage.jsx";
import AppsPage from "./pages/AppsPage.jsx";
import ArcadePage from "./pages/ArcadePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";

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

function AppShell() {
  const { platform, meta } = usePlatform();
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.pathname),
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
    document.documentElement.dataset.platform = platform;
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
    <div className={`web-native-shell platform-${platform}`}>
      <PlatformSwitcher />
      <DeviceFrame nav={nav}>
        <KonstaApp
          key={meta.konstaTheme}
          theme={meta.konstaTheme}
          dark
          safeAreas={false}
          className={`ios-shell dark no-safe-areas-bottom theme-${meta.konstaTheme}`}
        >
          <div className="app-wallpaper" aria-hidden data-platform={platform} />
          <main className="tab-stage">
            {/* key path only — same page base when switching platform */}
            <ActivePage key={activePath} />
          </main>
        </KonstaApp>
      </DeviceFrame>
    </div>
  );
}

export default function App() {
  return (
    <PlatformProvider>
      <AppShell />
    </PlatformProvider>
  );
}
