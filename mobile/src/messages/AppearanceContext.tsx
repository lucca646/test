import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";
import { DEFAULT_THEME_PRESET, type ThemePresetId } from "./themePresets";

export type AppearanceMode = "system" | "light" | "dark";
export type { ThemePresetId };

type AppearanceValue = {
  mode: AppearanceMode;
  /** Thème effectif résolu (system → schéma OS courant). */
  resolvedScheme: "light" | "dark";
  setMode: (mode: AppearanceMode) => void;
  /** Thème de couleur choisi dans Paramètres → Thème (défaut « Bleu »). */
  themeId: ThemePresetId;
  setThemeId: (id: ThemePresetId) => void;
};

export const AppearanceOverrideContext = createContext<AppearanceValue | null>(null);
const Ctx = AppearanceOverrideContext;

/**
 * Surcharge locale du thème (mémoire app, pas de persistance disque pour
 * l'instant — pas d'AsyncStorage dans le projet). Défaut : suit le système
 * + palette de couleurs par défaut.
 */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<AppearanceMode>("system");
  const [themeId, setThemeId] = useState<ThemePresetId>(DEFAULT_THEME_PRESET);

  const resolvedScheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "light" ? "light" : "dark") : mode;

  const value = useMemo(
    () => ({
      mode,
      resolvedScheme,
      setMode: (m: AppearanceMode) => setMode(m),
      themeId,
      setThemeId: (id: ThemePresetId) => setThemeId(id),
    }),
    [mode, resolvedScheme, themeId],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppearance hors AppearanceProvider");
  return ctx;
}
