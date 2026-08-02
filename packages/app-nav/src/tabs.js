/**
 * Source UNIQUE de la barre d’onglets — web lab + iOS (NativeTabs / UITabBar).
 * Catalogue COR·ALT — Accueil (plan du jour) en premier.
 *
 * `hidden: true` retire l’onglet de la barre partout, sans supprimer la route.
 * `side` = split web uniquement (iOS reste UITabBar Apple).
 */

/** Teinte sélection — bleu système iOS / dock validé */
export const NAV_TINT = "#0a84ff";

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
    id: "accueil",
    path: "/accueil/",
    routeName: "accueil",
    label: "Accueil",
    short: "Accueil",
    sf: { default: "house", selected: "house.fill" },
    f7: { default: "House", active: "HouseFill" },
    ion: { default: "home-outline", active: "home" },
    badge: null,
    hidden: false,
    side: "left",
  },
  {
    id: "envois",
    path: "/envois/",
    routeName: "envois",
    label: "Envois",
    short: "Envois",
    sf: {
      default: "paperplane",
      selected: "paperplane.fill",
    },
    f7: { default: "Paperplane", active: "PaperplaneFill" },
    ion: { default: "paper-plane-outline", active: "paper-plane" },
    badge: null,
    hidden: false,
    side: "left",
  },
  {
    id: "entreprises",
    path: "/entreprises/",
    routeName: "entreprises",
    label: "Liste",
    short: "Liste",
    sf: { default: "building.2", selected: "building.2.fill" },
    f7: { default: "Layers", active: "LayersFill" },
    ion: { default: "business-outline", active: "business" },
    badge: null,
    hidden: false,
    side: "right",
  },
  {
    id: "recherche",
    path: "/recherche/",
    routeName: "recherche",
    label: "Recherche",
    short: "Recherche",
    sf: "magnifyingglass",
    f7: { default: "Search", active: "Search" },
    ion: { default: "search-outline", active: "search" },
    badge: null,
    /** Hors barre — accessible depuis Accueil */
    hidden: true,
    side: "left",
  },
  {
    id: "parametres",
    path: "/parametres/",
    routeName: "parametres",
    label: "Profil",
    short: "Profil",
    sf: {
      default: "person.crop.circle",
      selected: "person.crop.circle.fill",
    },
    f7: { default: "Today", active: "TodayFill" },
    ion: { default: "person-circle-outline", active: "person-circle" },
    badge: null,
    hidden: false,
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
