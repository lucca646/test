import { useState, useCallback, useEffect } from "react";
import { App as KonstaApp } from "konsta/react";
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

export default function App() {
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.pathname),
  );

  useEffect(() => {
    document.documentElement.classList.add("dark");
    document.documentElement.style.colorScheme = "dark";
  }, []);

  const selectTab = useCallback((path) => {
    const next = normalizePath(path);
    setActivePath(next);
    window.history.replaceState({}, "", next === "/" ? "/" : next);
  }, []);

  const ActivePage = PAGES[activePath] || TodayPage;

  return (
    <KonstaApp theme="ios" dark safeAreas className="ios-shell dark">
      <div className="app-wallpaper" aria-hidden />
      <main className="tab-stage">
        <ActivePage key={activePath} />
      </main>
      <AppTabbar activePath={activePath} onSelect={selectTab} />
    </KonstaApp>
  );
}
