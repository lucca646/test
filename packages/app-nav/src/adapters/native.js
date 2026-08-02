import { APP_TABS } from "../tabs.js";

/** @typedef {import("../tabs.js").AppTab} AppTab */

/**
 * @typedef {{
 *   name: string,
 *   role: "search" | undefined,
 *   hidden: boolean,
 *   label: string,
 *   badge: string | null | undefined,
 *   sf: AppTab["sf"],
 * }} NativeTabTrigger
 */

/**
 * Map shared catalog entries to NativeTabs trigger props (pure data — no React).
 * Keeps the Apple UITabBar path: consumers render `<NativeTabs.Trigger>` from this data.
 * @param {AppTab[]} [tabs]
 * @returns {NativeTabTrigger[]}
 */
export function toNativeTriggers(tabs = APP_TABS) {
  return tabs.map((tab) => ({
    name: tab.routeName,
    role: tab.role === "search" ? "search" : undefined,
    hidden: Boolean(tab.hidden),
    label: tab.label,
    badge: tab.badge ?? null,
    sf: tab.sf,
  }));
}
