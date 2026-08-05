/**
 * Thèmes de couleurs (Paramètres → Thème) — inspirés des palettes coolors.co
 * envoyées en référence : chaque thème teinte subtilement le fond + l'accent
 * (boutons, liens, bulle envoyée « manuel »), tout en gardant la lisibilité
 * du mode clair/sombre.
 */

export type ThemePresetId =
  | "blue"
  | "purple"
  | "green"
  | "coral"
  | "pink"
  | "amber";

export type ThemePreset = {
  id: ThemePresetId;
  name: string;
  /** Aperçu façon coolors (4 pastilles), du plus sombre au plus clair. */
  swatches: [string, string, string, string];
  accentLight: string;
  accentDark: string;
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "blue",
    name: "Bleu",
    swatches: ["#0a3d67", "#007aff", "#5ac8fa", "#e8f1ff"],
    accentLight: "#007aff",
    accentDark: "#0a84ff",
  },
  {
    id: "purple",
    name: "Violet",
    swatches: ["#211a1d", "#6320ee", "#8075ff", "#f8f0fb"],
    accentLight: "#6320ee",
    accentDark: "#8075ff",
  },
  {
    id: "green",
    name: "Menthe",
    swatches: ["#0b3d2e", "#0b8457", "#34c759", "#c7eae4"],
    accentLight: "#178a5c",
    accentDark: "#30d158",
  },
  {
    id: "coral",
    name: "Corail",
    swatches: ["#223843", "#d8b4a0", "#d77a61", "#eff1f3"],
    accentLight: "#c1613f",
    accentDark: "#e08a6f",
  },
  {
    id: "pink",
    name: "Rose",
    swatches: ["#7a3b45", "#efa7a7", "#fcbcb8", "#ffd972"],
    accentLight: "#c65a6d",
    accentDark: "#f2a3a3",
  },
  {
    id: "amber",
    name: "Ambre",
    swatches: ["#5c3d00", "#c98a00", "#ff9f0a", "#ffd972"],
    accentLight: "#b8790a",
    accentDark: "#ffb340",
  },
];

export const DEFAULT_THEME_PRESET: ThemePresetId = "blue";

export function getThemePreset(id: ThemePresetId): ThemePreset {
  return THEME_PRESETS.find((t) => t.id === id) ?? THEME_PRESETS[0];
}

// --- Utilitaires couleur (mélange + alpha) — pas de dépendance externe ---

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean.split("").map((c) => c + c).join("")
      : clean;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toHex(n: number): string {
  return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0");
}

/** Mélange `hex` vers `hex2` — `t` = 0 (hex) → 1 (hex2). */
export function mixHex(hex: string, hex2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hex);
  const [r2, g2, b2] = hexToRgb(hex2);
  const r = r1 + (r2 - r1) * t;
  const g = g1 + (g2 - g1) * t;
  const b = b1 + (b2 - b1) * t;
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/** `hex` en `rgba(...)` avec l'opacité donnée (0–1). */
export function hexWithAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
