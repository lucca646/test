import { APP_TABS } from "../src/tabs.js";
import { assertNavCatalog, NAV_SCHEMA_VERSION } from "../src/schema.js";

try {
  assertNavCatalog(APP_TABS);
  console.log(`NAV_SCHEMA_VERSION ${NAV_SCHEMA_VERSION} OK`);
  process.exit(0);
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
