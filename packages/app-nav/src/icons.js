/** @typedef {import("./tabs.js").AppTab} AppTab */

/** @typedef {"sf" | "f7" | "ion"} IconSet */

/**
 * @param {string} context
 * @param {string} message
 */
function warnMissing(context, message) {
  const isDev =
    typeof process !== "undefined" &&
    process.env &&
    process.env.NODE_ENV !== "production";
  if (isDev) {
    console.warn(`[app-nav/icons] ${context}: ${message}`);
  }
}

/**
 * Normalize icon pair for a tab and icon set.
 * SF symbols accept string or `{ default, selected }`; f7/ion use `{ default, active }`.
 * @param {AppTab} tab
 * @param {IconSet} set
 * @returns {{ default: string, active: string }}
 */
export function iconPair(tab, set) {
  const tabId = tab?.id ?? "?";

  if (set === "sf") {
    const sf = tab?.sf;
    if (typeof sf === "string") {
      return { default: sf, active: sf };
    }
    if (sf && typeof sf === "object") {
      const def = sf.default ?? "";
      const active = sf.selected ?? sf.default ?? "";
      if (!def) warnMissing(tabId, "missing sf.default");
      return { default: def, active: active || def };
    }
    warnMissing(tabId, "missing sf icon");
    return { default: "", active: "" };
  }

  if (set === "f7" || set === "ion") {
    const pair = tab?.[set];
    if (pair && typeof pair === "object") {
      const def = pair.default ?? "";
      const active = pair.active ?? pair.default ?? "";
      if (!def) warnMissing(tabId, `missing ${set}.default`);
      return { default: def, active: active || def };
    }
    warnMissing(tabId, `missing ${set} icon pair`);
    return { default: "", active: "" };
  }

  warnMissing(tabId, `unknown icon set "${set}"`);
  return { default: "", active: "" };
}
