import TodayPage from "./pages/TodayPage.jsx";
import ArcadePage from "./pages/ArcadePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export const routes = [
  {
    path: "/",
    component: TodayPage,
    options: { transition: "f7-fade" },
  },
  {
    path: "/arcade/",
    component: ArcadePage,
    options: { transition: "f7-cover" },
  },
  {
    path: "/search/",
    component: SearchPage,
    options: { transition: "f7-parallax" },
  },
  {
    path: "/settings/",
    component: SettingsPage,
    options: { transition: "f7-push" },
  },
];
