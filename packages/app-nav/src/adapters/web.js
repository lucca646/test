/** @typedef {import("../tabs.js").AppTab} AppTab */

/** Strip trailing slash except root. */
function stripTrailingSlash(path) {
  if (path === "/") return "/";
  return path.replace(/\/+$/, "") || "/";
}

/** Canonical path with trailing slash for non-root routes. */
function canonicalPath(path) {
  if (path === "/") return "/";
  return path.endsWith("/") ? path : `${path}/`;
}

/**
 * Build a path → tab index including aliases without trailing slash.
 * @param {AppTab[]} tabs
 * @returns {Map<string, AppTab>}
 */
export function buildWebPathIndex(tabs) {
  /** @type {Map<string, AppTab>} */
  const index = new Map();

  for (const tab of tabs) {
    index.set(tab.path, tab);
    index.set(stripTrailingSlash(tab.path), tab);
    index.set(canonicalPath(tab.path), tab);
  }

  // Legacy alias: settings routes → search tab
  const searchTab = tabs.find((t) => t.id === "search" || t.path === "/search/");
  if (searchTab) {
    index.set("/settings", searchTab);
    index.set("/settings/", searchTab);
  }

  return index;
}

/**
 * Normalize a browser path to a catalog path using tab index lookup.
 * @param {string} path
 * @param {AppTab[]} tabs
 * @returns {string}
 */
export function normalizeWebPath(path, tabs) {
  if (!path || path === "") return "/";

  const index = buildWebPathIndex(tabs);
  const candidates = [path, stripTrailingSlash(path), canonicalPath(path)];

  for (const candidate of candidates) {
    const tab = index.get(candidate);
    if (tab) return tab.path;
  }

  return "/";
}

/**
 * Split visible tabs into left/right groups (web split-bottom chrome only).
 * Mirrors `tabsBySide()` but accepts an explicit tab list.
 * @param {AppTab[]} tabs
 * @returns {{ left: AppTab[], right: AppTab[] }}
 */
export function toWebSplitGroups(tabs) {
  const visible = tabs.filter((t) => !t.hidden);
  return {
    left: visible.filter((t) => (t.side || "left") === "left"),
    right: visible.filter((t) => t.side === "right"),
  };
}

/**
 * Map tabs to web chrome item props (pure data — no React).
 * @param {AppTab[]} tabs
 * @param {{ useShort?: boolean }} [options]
 * @returns {Array<{ id: string, path: string, label: string, short: string, badge: string | null | undefined, f7: AppTab["f7"], ion: AppTab["ion"], side: AppTab["side"] }>}
 */
export function toChromeItems(tabs, { useShort = false } = {}) {
  return tabs.map((tab) => ({
    id: tab.id,
    path: tab.path,
    label: useShort ? tab.short || tab.label : tab.label,
    short: tab.short,
    badge: tab.badge ?? null,
    f7: tab.f7,
    ion: tab.ion,
    side: tab.side,
  }));
}
