/**
 * Source UNIQUE de la barre d’onglets — web + iOS (NativeTabs / UITabBar).
 * Modifier ici → les deux clients suivent (OTA JS / Vite HMR).
 *
 * `hidden: true` retire l’onglet de la barre partout, sans supprimer la route.
 * `side` = split web uniquement (iOS reste UITabBar Apple).
 */

/** Teinte sélection */
export const NAV_TINT = "#64D2FF";

/**
 * @typedef {{
 *   id: string,
 *   path: string,
 *   routeName: string,
 *   label: string,
 *   short: string,
 *   sf: string | { default: string, selected: string },
 *   f7: { default: string, active: string },
 *   ion: { default: string, active: string },
 *   badge?: string | null,
 *   role?: string,
 *   hidden?: boolean,
 *   side?: "left" | "center" | "right",
 * }} AppTab
 */

/** @type {AppTab[]} */
export const APP_TABS = [
  {
    id: "today",
    path: "/",
    routeName: "index",
    label: "Aujourd'hui",
    short: "Today",
    sf: { default: "sun.max", selected: "sun.max.fill" },
    f7: { default: "Today", active: "TodayFill" },
    ion: { default: "sunny-outline", active: "sunny" },
    badge: null,
    hidden: false,
    side: "left",
  },
  {
    id: "games",
    path: "/games/",
    routeName: "games",
    label: "Jeux",
    short: "Jeux",
    sf: { default: "flame", selected: "flame.fill" },
    f7: { default: "Rocket", active: "RocketFill" },
    ion: { default: "flame-outline", active: "flame" },
    badge: null,
    hidden: false,
    side: "left",
  },
  {
    id: "actu",
    path: "/actu/",
    routeName: "actu",
    label: "Actu",
    short: "Actu",
    sf: { default: "newspaper", selected: "newspaper.fill" },
    f7: { default: "DocText", active: "DocTextFill" },
    ion: { default: "newspaper-outline", active: "newspaper" },
    badge: null,
    hidden: false,
    /** Bouton central plus grand (web) ; au milieu de la UITabBar iOS */
    side: "center",
  },
  {
    id: "arcade",
    path: "/arcade/",
    routeName: "arcade",
    label: "Arcade",
    short: "Arcade",
    sf: { default: "gamecontroller", selected: "gamecontroller.fill" },
    f7: { default: "Gamecontroller", active: "GamecontrollerFill" },
    ion: { default: "game-controller-outline", active: "game-controller" },
    badge: null,
    hidden: false,
    side: "right",
  },
  {
    id: "apps",
    path: "/apps/",
    routeName: "apps",
    label: "Apps",
    short: "Apps",
    sf: {
      default: "square.stack.3d.up",
      selected: "square.stack.3d.up.fill",
    },
    f7: { default: "Layers", active: "LayersFill" },
    ion: { default: "layers-outline", active: "layers" },
    badge: "OTA",
    hidden: false,
    side: "right",
  },
  {
    id: "search",
    path: "/search/",
    routeName: "search",
    label: "Recherche",
    short: "Search",
    sf: {
      default: "magnifyingglass",
      selected: "magnifyingglass.circle.fill",
    },
    f7: { default: "Search", active: "Search" },
    ion: { default: "search-outline", active: "search" },
    role: "search",
    badge: null,
    /** false = visible partout ; true = masqué web + iOS */
    hidden: true,
    side: "right",
  },
];

/** Onglets affichés dans la barre */
export function visibleTabs() {
  return APP_TABS.filter((t) => !t.hidden);
}

/** Groupes gauche / centre / droite — web (iOS ignore `side`) */
export function tabsBySide() {
  const tabs = visibleTabs();
  return {
    left: tabs.filter((t) => (t.side || "left") === "left"),
    center: tabs.filter((t) => t.side === "center"),
    right: tabs.filter((t) => t.side === "right"),
  };
}

/** Tous les onglets (routes natives, y compris hidden) */
export function allTabs() {
  return APP_TABS;
}

// Schema contract — see NAV_SCHEMA_VERSION in schema.js (validated by scripts/check.mjs).
import { validateNavCatalog, NAV_SCHEMA_VERSION } from "./schema.js";

const _catalogCheck = validateNavCatalog(APP_TABS);
if (!_catalogCheck.ok) {
  console.warn(
    `[app-nav] Invalid APP_TABS (schema v${NAV_SCHEMA_VERSION}):\n${_catalogCheck.errors.map((e) => `  - ${e}`).join("\n")}`,
  );
}
