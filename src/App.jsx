import { useState, useCallback } from "react";
import { App as F7App } from "framework7-react";
import { KonstaProvider } from "konsta/react";
import AppTabbar from "./components/AppTabbar.jsx";
import TodayPage from "./pages/TodayPage.jsx";
import ArcadePage from "./pages/ArcadePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

const PAGES = {
  "/": TodayPage,
  "/arcade/": ArcadePage,
  "/search/": SearchPage,
  "/settings/": SettingsPage,
};

const f7params = {
  name: "Liquid Glass",
  theme: "ios",
  darkMode: true,
  // Pas de router F7 pour les tabs — rendu React direct (fiable)
  routes: [],
};

function normalizePath(path) {
  if (!path || path === "") return "/";
  if (path === "/arcade") return "/arcade/";
  if (path === "/search") return "/search/";
  if (path === "/settings") return "/settings/";
  return PAGES[path] ? path : "/";
}

export default function App() {
  const [activePath, setActivePath] = useState(() =>
    normalizePath(window.location.pathname),
  );

  const selectTab = useCallback((path) => {
    const next = normalizePath(path);
    setActivePath(next);
    window.history.replaceState({}, "", next === "/" ? "/" : next);
  }, []);

  const ActivePage = PAGES[activePath] || TodayPage;

  return (
    <>
      <div className="app-wallpaper" aria-hidden />
      <KonstaProvider theme="ios" dark>
        <div className="ios-shell k-ios dark">
          <F7App {...f7params} className="k-ios dark safe-areas">
            <div className="tab-stage">
              <ActivePage key={activePath} />
            </div>
            <AppTabbar activePath={activePath} onSelect={selectTab} />
          </F7App>
        </div>
      </KonstaProvider>
    </>
  );
}
