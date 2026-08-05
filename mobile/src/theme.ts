import { useContext } from "react";
import { useColorScheme, type ColorSchemeName } from "react-native";
import { AppearanceOverrideContext } from "./messages/AppearanceContext";
import {
  DEFAULT_THEME_PRESET,
  getThemePreset,
  hexWithAlpha,
  mixHex,
  type ThemePresetId,
} from "./messages/themePresets";

export type ThemeColors = {
  bg: string;
  card: string;
  cardSolid: string;
  /** Fond des bulles de message entrant (distinct de `card`, façon PWA). */
  bubbleIn: string;
  /** Fond des bulles de message sortant envoyé par le bot (vs `accent` = envoi manuel UI). */
  bubbleBot: string;
  surfaceElevated: string;
  stackSilhouette: string;
  border: string;
  text: string;
  muted: string;
  accent: string;
  danger: string;
  success: string;
  warning: string;
  searchBg: string;
  pillBg: string;
  pillSentBg: string;
  pillMutedBg: string;
  pillWarnBg: string;
  pillText: string;
  pillSentText: string;
  pillMutedText: string;
  pillWarnText: string;
  separator: string;
  rowPressed: string;
  chevron: string;
  bannerInfoBg: string;
  bannerInfoBorder: string;
  bannerErrorBg: string;
  bannerErrorBorder: string;
  bannerSuccessBg: string;
  bannerSuccessBorder: string;
  statusBar: "light" | "dark";
  tabBlur: "systemMaterial" | "systemMaterialDark";
};

const dark: ThemeColors = {
  bg: "#000000",
  card: "#1c1c1e",
  cardSolid: "#1c1c1e",
  bubbleIn: "#262629",
  bubbleBot: "#30d158",
  surfaceElevated: "#2c2c2e",
  stackSilhouette: "#2c2c2e",
  border: "rgba(84,84,88,0.65)",
  text: "#ffffff",
  muted: "rgba(235,235,245,0.60)",
  accent: "#0a84ff",
  danger: "#ff453a",
  success: "#30d158",
  warning: "#ff9f0a",
  searchBg: "rgba(118,118,128,0.24)",
  pillBg: "rgba(10,132,255,0.35)",
  pillSentBg: "rgba(48,209,88,0.28)",
  pillMutedBg: "rgba(120,120,128,0.32)",
  pillWarnBg: "rgba(255,159,10,0.28)",
  pillText: "#64b5ff",
  pillSentText: "#30d158",
  pillMutedText: "rgba(235,235,245,0.70)",
  pillWarnText: "#ff9f0a",
  separator: "rgba(84,84,88,0.55)",
  rowPressed: "rgba(120,120,128,0.20)",
  chevron: "rgba(235,235,245,0.30)",
  bannerInfoBg: "rgba(10,132,255,0.16)",
  bannerInfoBorder: "rgba(10,132,255,0.32)",
  bannerErrorBg: "rgba(255,69,58,0.16)",
  bannerErrorBorder: "rgba(255,69,58,0.32)",
  bannerSuccessBg: "rgba(48,209,88,0.16)",
  bannerSuccessBorder: "rgba(48,209,88,0.32)",
  statusBar: "light",
  tabBlur: "systemMaterialDark",
};

const light: ThemeColors = {
  bg: "#f2f2f7",
  card: "#ffffff",
  cardSolid: "#ffffff",
  bubbleIn: "#e9e9eb",
  bubbleBot: "#34c759",
  surfaceElevated: "#ffffff",
  stackSilhouette: "#e5e5ea",
  border: "rgba(60,60,67,0.18)",
  text: "#000000",
  muted: "rgba(60,60,67,0.60)",
  accent: "#007aff",
  danger: "#ff3b30",
  success: "#34c759",
  warning: "#ff9f0a",
  searchBg: "rgba(120,120,128,0.12)",
  pillBg: "#e8f1ff",
  pillSentBg: "#eaf8ee",
  pillMutedBg: "rgba(120,120,128,0.14)",
  pillWarnBg: "#fff4e0",
  pillText: "#007aff",
  pillSentText: "#248a3d",
  pillMutedText: "rgba(60,60,67,0.65)",
  pillWarnText: "#c93400",
  separator: "rgba(60,60,67,0.22)",
  rowPressed: "rgba(0,0,0,0.05)",
  chevron: "rgba(60,60,67,0.30)",
  bannerInfoBg: "rgba(0,122,255,0.10)",
  bannerInfoBorder: "rgba(0,122,255,0.28)",
  bannerErrorBg: "rgba(255,59,48,0.10)",
  bannerErrorBorder: "rgba(255,59,48,0.28)",
  bannerSuccessBg: "rgba(52,199,89,0.10)",
  bannerSuccessBorder: "rgba(52,199,89,0.28)",
  statusBar: "dark",
  tabBlur: "systemMaterial",
};

/** Fallback sync pour styles hors hooks (évite crash). */
export const colors: ThemeColors = dark;

export function colorsFor(scheme: ColorSchemeName | null | undefined): ThemeColors {
  return scheme === "light" ? light : dark;
}

/**
 * Applique un thème de couleur (Paramètres → Thème) par-dessus la palette
 * clair/sombre de base : teinte le fond/les surfaces vers l'accent choisi et
 * dérive les pastilles/bannières de ce même accent, pour que tout l'app
 * (bulles, liens, listes…) suive un seul et même thème cohérent.
 */
function applyThemePreset(
  base: ThemeColors,
  themeId: ThemePresetId,
  scheme: "light" | "dark",
): ThemeColors {
  const preset = getThemePreset(themeId);
  const accent = scheme === "light" ? preset.accentLight : preset.accentDark;
  // Le thème "Bleu" reprend l'accent iOS d'origine — mais applique quand même
  // les mêmes dérivés (rowPressed/chevron/stackSilhouette) pour rester cohérent
  // avec les autres presets plutôt que de sortir tôt sans rien teinter.
  const isDefault = themeId === "blue";
  const bgTintWeight = isDefault ? 0 : scheme === "light" ? 0.06 : 0.09;
  const cardTintWeight = isDefault ? 0 : scheme === "light" ? 0.03 : 0.05;

  return {
    ...base,
    accent,
    bg: mixHex(base.bg, accent, bgTintWeight),
    card: mixHex(base.card, accent, cardTintWeight),
    cardSolid: mixHex(base.cardSolid, accent, cardTintWeight),
    surfaceElevated: mixHex(base.surfaceElevated, accent, cardTintWeight),
    stackSilhouette: mixHex(base.stackSilhouette, accent, cardTintWeight),
    bubbleIn: mixHex(base.bubbleIn, accent, cardTintWeight * 1.5),
    pillBg: hexWithAlpha(accent, scheme === "light" ? 0.12 : 0.32),
    pillText: accent,
    searchBg: hexWithAlpha(accent, scheme === "light" ? 0.08 : 0.2),
    // Retour visuel au toucher (listes) et chevrons de navigation teintés
    // par l'accent — jusqu'ici toujours gris neutre, quel que soit le thème.
    rowPressed: hexWithAlpha(accent, scheme === "light" ? 0.1 : 0.22),
    chevron: hexWithAlpha(accent, scheme === "light" ? 0.55 : 0.6),
    bannerInfoBg: hexWithAlpha(accent, scheme === "light" ? 0.1 : 0.16),
    bannerInfoBorder: hexWithAlpha(accent, scheme === "light" ? 0.28 : 0.32),
  };
}

/**
 * Thème = Appearance iOS (Réglages → Affichage), sauf si l'utilisateur a
 * choisi une surcharge dans Paramètres → Apparence (`AppearanceContext`),
 * + palette de couleurs (Paramètres → Thème, mémoire app par défaut « Bleu »).
 */
export function useColors(): ThemeColors {
  const systemScheme = useColorScheme();
  const override = useContext(AppearanceOverrideContext);
  const scheme: "light" | "dark" =
    override?.resolvedScheme ?? (systemScheme === "light" ? "light" : "dark");
  const themeId = override?.themeId ?? DEFAULT_THEME_PRESET;
  return applyThemePreset(colorsFor(scheme), themeId, scheme);
}

/** Padding bas pour ne pas passer sous UITabBar + home indicator. */
export const TAB_BAR_CLEARANCE = 132;
