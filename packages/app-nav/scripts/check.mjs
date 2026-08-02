import { APP_TABS } from "../src/tabs.js";
import { ACTU_ARTICLES, ACTU_SCHEMA_VERSION } from "../src/actu.js";
import { assertNavCatalog, NAV_SCHEMA_VERSION } from "../src/schema.js";

try {
  assertNavCatalog(APP_TABS);
  if (!APP_TABS.some((t) => t.id === "actu" && !t.hidden)) {
    throw new Error("onglet actu manquant ou hidden");
  }
  const camera = APP_TABS.find((t) => t.id === "camera" && !t.hidden);
  if (!camera) {
    throw new Error("onglet camera manquant ou hidden");
  }
  if (camera.side !== "center") {
    throw new Error('onglet camera doit avoir side: "center"');
  }
  if (!Array.isArray(ACTU_ARTICLES) || ACTU_ARTICLES.length < 1) {
    throw new Error("ACTU_ARTICLES vide");
  }
  console.log(`NAV_SCHEMA_VERSION ${NAV_SCHEMA_VERSION} OK`);
  console.log(`ACTU_SCHEMA_VERSION ${ACTU_SCHEMA_VERSION} · ${ACTU_ARTICLES.length} articles`);
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
