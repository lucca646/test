/**
 * Registre F7 unique — web live + lab.
 * Les clés doivent matcher `tab.f7` dans packages/app-nav.
 */
import {
  Today,
  TodayFill,
  Rocket,
  RocketFill,
  Layers,
  LayersFill,
  Gamecontroller,
  GamecontrollerFill,
  Search,
} from "framework7-icons/react/framework7-icons-react.esm.js";
import { iconPair } from "app-nav";

export const F7_ICON_MAP = {
  Today,
  TodayFill,
  Rocket,
  RocketFill,
  Layers,
  LayersFill,
  Gamecontroller,
  GamecontrollerFill,
  Search,
};

/**
 * @param {import("app-nav").AppTab | { f7: { default: string, active: string } }} tab
 * @returns {{ Default: import("react").ComponentType, Active: import("react").ComponentType }}
 */
export function resolveF7Icons(tab) {
  const pair = iconPair(tab, "f7");
  const Default = F7_ICON_MAP[pair.default] || Search;
  const Active = F7_ICON_MAP[pair.active] || Default;

  if (
    typeof import.meta !== "undefined" &&
    import.meta.env?.DEV &&
    (!F7_ICON_MAP[pair.default] || !F7_ICON_MAP[pair.active])
  ) {
    console.warn(
      `[app-nav] icône F7 manquante pour tab — fallback Search`,
      pair,
      tab?.id,
    );
  }

  return { Default, Active };
}
