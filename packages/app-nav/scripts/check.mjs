import { APP_TABS } from "../src/tabs.js";
import { HOME, HOME_SCHEMA_VERSION } from "../src/home.js";
import { assertNavCatalog } from "../src/schema.js";

try {
  assertNavCatalog(APP_TABS);

  const requiredVisible = ["accueil", "envois", "entreprises", "parametres"];
  for (const id of requiredVisible) {
    const tab = APP_TABS.find((t) => t.id === id && !t.hidden);
    if (!tab) throw new Error(`onglet ${id} manquant ou hidden`);
  }

  const recherche = APP_TABS.find((t) => t.id === "recherche");
  if (!recherche) throw new Error("route recherche manquante");
  if (!recherche.hidden) {
    throw new Error("recherche doit être hidden (accessible depuis Accueil)");
  }

  const order = APP_TABS.filter((t) => !t.hidden).map((t) => t.id);
  if (order[0] !== "accueil") {
    throw new Error("Accueil doit être le premier onglet visible");
  }

  if (!HOME?.kicker || !HOME?.title) {
    throw new Error("HOME kicker/title requis");
  }
  if (typeof HOME_SCHEMA_VERSION !== "number") {
    throw new Error("HOME_SCHEMA_VERSION manquant");
  }

  console.log(
    `app-nav OK — COR·ALT tabs (${APP_TABS.filter((t) => !t.hidden).length}) · HOME v${HOME_SCHEMA_VERSION}`,
  );
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
