import TodayPage from "./pages/TodayPage.jsx";
import GamesPage from "./pages/GamesPage.jsx";
import AppsPage from "./pages/AppsPage.jsx";
import ArcadePage from "./pages/ArcadePage.jsx";
import SearchPage from "./pages/SearchPage.jsx";

export const routes = [
  { path: "/", component: TodayPage },
  { path: "/games/", component: GamesPage },
  { path: "/apps/", component: AppsPage },
  { path: "/arcade/", component: ArcadePage },
  { path: "/search/", component: SearchPage },
];
