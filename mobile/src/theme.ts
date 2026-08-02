import { useColorScheme, type ColorSchemeName } from "react-native";

export type ThemeColors = {
  bg: string;
  card: string;
  cardSolid: string;
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
  separator: string;
  rowPressed: string;
  chevron: string;
  statusBar: "light" | "dark";
  tabBlur: "systemMaterial" | "systemMaterialDark";
};

const dark: ThemeColors = {
  bg: "#000000",
  card: "#1c1c1e",
  cardSolid: "#1c1c1e",
  border: "rgba(84,84,88,0.65)",
  text: "#ffffff",
  muted: "rgba(235,235,245,0.65)",
  accent: "#0a84ff",
  danger: "#ff453a",
  success: "#30d158",
  warning: "#ffd60a",
  searchBg: "rgba(118,118,128,0.28)",
  pillBg: "rgba(10,132,255,0.28)",
  pillSentBg: "rgba(48,209,88,0.28)",
  pillMutedBg: "rgba(120,120,128,0.32)",
  pillWarnBg: "rgba(255,214,10,0.28)",
  separator: "rgba(84,84,88,0.55)",
  rowPressed: "rgba(120,120,128,0.22)",
  chevron: "rgba(235,235,245,0.35)",
  statusBar: "light",
  tabBlur: "systemMaterialDark",
};

const light: ThemeColors = {
  bg: "#f2f2f7",
  card: "#ffffff",
  cardSolid: "#ffffff",
  border: "rgba(60,60,67,0.18)",
  text: "#000000",
  muted: "rgba(60,60,67,0.65)",
  accent: "#007aff",
  danger: "#ff3b30",
  success: "#34c759",
  warning: "#ff9f0a",
  searchBg: "rgba(120,120,128,0.16)",
  pillBg: "rgba(0,122,255,0.14)",
  pillSentBg: "rgba(52,199,89,0.16)",
  pillMutedBg: "rgba(120,120,128,0.16)",
  pillWarnBg: "rgba(255,159,10,0.18)",
  separator: "rgba(60,60,67,0.18)",
  rowPressed: "rgba(0,0,0,0.06)",
  chevron: "rgba(60,60,67,0.35)",
  statusBar: "dark",
  tabBlur: "systemMaterial",
};

/** Fallback sync pour styles hors hooks (évite crash). */
export const colors: ThemeColors = dark;

export function colorsFor(scheme: ColorSchemeName | null | undefined): ThemeColors {
  return scheme === "light" ? light : dark;
}

/** Thème = Appearance iOS (Réglages → Affichage). */
export function useColors(): ThemeColors {
  return colorsFor(useColorScheme());
}

/** Padding bas pour ne pas passer sous UITabBar + home indicator. */
export const TAB_BAR_CLEARANCE = 108;
