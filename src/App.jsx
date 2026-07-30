import { useEffect, useState, useCallback } from "react";
import { App as F7App, View, f7, f7ready } from "framework7-react";
import { KonstaProvider } from "konsta/react";
import { routes } from "./routes.js";
import AppTabbar from "./components/AppTabbar.jsx";

const f7params = {
  name: "Liquid Glass",
  theme: "ios",
  darkMode: true,
  routes,
  view: {
    iosSwipeBack: true,
    browserHistory: true,
    browserHistoryRoot: "/",
  },
};

export default function App() {
  const [activePath, setActivePath] = useState(window.location.pathname || "/");

  useEffect(() => {
    f7ready(() => {
      f7.on("routeChange", (route) => {
        if (route?.path) setActivePath(route.path);
      });
      setActivePath(f7.views.main?.router?.currentRoute?.path || "/");
    });
  }, []);

  const selectTab = useCallback((path) => {
    // Optimistic : bulle + bleu instantanés, avant la fin de la route F7
    setActivePath(path);
    f7.views.main.router.navigate(path, {
      animate: false,
      clearPreviousHistory: false,
      ignoreCache: false,
    });
  }, []);

  return (
    <>
      <div className="app-wallpaper" aria-hidden />
      <KonstaProvider theme="ios" dark>
        <div className="ios-shell k-ios dark">
          <F7App {...f7params} className="k-ios dark safe-areas">
            <View
              main
              url="/"
              browserHistory
              browserHistoryRoot="/"
              iosDynamicNavbar={false}
              className="safe-areas"
            />
            <AppTabbar activePath={activePath} onSelect={selectTab} />
          </F7App>
        </div>
      </KonstaProvider>
    </>
  );
}
