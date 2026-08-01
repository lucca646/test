/**
 * Source UNIQUE de la barre d’onglets — web + iOS (NativeTabs).
 * Modifier ici → les deux clients suivent (OTA JS / Vite HMR).
 *
 * `hidden: true` retire l’onglet de la barre partout, sans supprimer la route.
 */

/** Teinte sélection (UITabBar / LiquidGlass) */
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
 *   badge?: string | null,
 *   role?: string,
 *   hidden?: boolean,
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
    badge: null,
    hidden: false,
  },
  {
    id: "games",
    path: "/games/",
    routeName: "games",
    label: "Jeux",
    short: "Jeux",
    sf: { default: "flame", selected: "flame.fill" },
    f7: { default: "Rocket", active: "RocketFill" },
    badge: null,
    hidden: false,
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
    badge: "OTA",
    hidden: false,
  },
  {
    id: "arcade",
    path: "/arcade/",
    routeName: "arcade",
    label: "Arcade",
    short: "Arcade",
    sf: { default: "gamecontroller", selected: "gamecontroller.fill" },
    f7: { default: "Gamecontroller", active: "GamecontrollerFill" },
    badge: null,
    hidden: false,
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
    role: "search",
    badge: null,
    /** false = visible partout ; true = masqué web + iOS */
    hidden: true,
  },
];

/** Onglets affichés dans la barre */
export function visibleTabs() {
  return APP_TABS.filter((t) => !t.hidden);
}

/** Tous les onglets (routes natives, y compris hidden) */
export function allTabs() {
  return APP_TABS;
}
