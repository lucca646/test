import { useEffect, useState } from "react";
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
      const sync = (page) => {
        const path = page?.route?.path || window.location.pathname || "/";
        setActivePath(path);
      };
      f7.on("routeChange", (route) => setActivePath(route.path || "/"));
      f7.on("pageInit", sync);
      setActivePath(f7.views.main?.router?.currentRoute?.path || "/");
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
            <AppTabbar activePath={activePath} />
          </F7App>
        </div>
      </KonstaProvider>
    </>
  );
}
