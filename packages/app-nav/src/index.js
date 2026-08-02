export {
  APP_TABS,
  NAV_TINT,
  allTabs,
  visibleTabs,
  tabsBySide,
} from "./tabs.js";
export { HOME, HOME_SCHEMA_VERSION } from "./home.js";

export {
  NAV_SCHEMA_VERSION,
  assertNavCatalog,
  validateNavCatalog,
} from "./schema.js";

export {
  PLATFORM_IDS,
  CAPABILITIES,
  getCapabilities,
} from "./capabilities.js";

export { iconPair } from "./icons.js";

export { toNativeTriggers } from "./adapters/native.js";

export {
  normalizeWebPath,
  buildWebPathIndex,
  toWebSplitGroups,
  toChromeItems,
} from "./adapters/web.js";
