import EntreprisesPage from "./pages/EntreprisesPage.jsx";
import RecherchePage from "./pages/RecherchePage.jsx";
import EnvoisPage from "./pages/EnvoisPage.jsx";
import ParametresPage from "./pages/ParametresPage.jsx";

export const routes = [
  { path: "/", component: EntreprisesPage },
  { path: "/recherche/", component: RecherchePage },
  { path: "/envois/", component: EnvoisPage },
  { path: "/parametres/", component: ParametresPage },
];
