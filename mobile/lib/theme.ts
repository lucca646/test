import { useColorScheme } from "react-native";

export type AppScheme = "light" | "dark";

export type AppTheme = {
  scheme: AppScheme;
  isDark: boolean;
  background: string;
  backgroundGradient: [string, string];
  card: string;
  cardBorder: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  blobBlue: string;
  blobOrange: string;
  statusBar: "light" | "dark";
  tabBlur: "systemMaterial" | "systemMaterialDark";
};

const dark: Omit<AppTheme, "scheme" | "isDark"> = {
  background: "#050508",
  backgroundGradient: ["#161625", "#050508"],
  card: "rgba(28,28,30,0.82)",
  cardBorder: "rgba(255,255,255,0.12)",
  text: "#ffffff",
  textSecondary: "rgba(255,255,255,0.92)",
  textMuted: "rgba(255,255,255,0.72)",
  blobBlue: "rgba(56,120,255,0.55)",
  blobOrange: "rgba(255,120,60,0.45)",
  statusBar: "light",
  tabBlur: "systemMaterialDark",
};

const light: Omit<AppTheme, "scheme" | "isDark"> = {
  background: "#f2f2f7",
  backgroundGradient: ["#ffffff", "#e8eef8"],
  card: "rgba(255,255,255,0.92)",
  cardBorder: "rgba(0,0,0,0.08)",
  text: "#0a0a0c",
  textSecondary: "rgba(10,10,12,0.88)",
  textMuted: "rgba(10,10,12,0.58)",
  blobBlue: "rgba(56,120,255,0.28)",
  blobOrange: "rgba(255,120,60,0.22)",
  statusBar: "dark",
  tabBlur: "systemMaterial",
};

/** Thème adaptatif = Appearance système (Réglages iOS). */
export function useAppTheme(): AppTheme {
  const scheme = (useColorScheme() === "light" ? "light" : "dark") as AppScheme;
  const base = scheme === "light" ? light : dark;
  return { ...base, scheme, isDark: scheme === "dark" };
}
