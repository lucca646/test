import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useColorScheme } from "react-native";

export type AppearanceMode = "system" | "light" | "dark";

type AppearanceValue = {
  mode: AppearanceMode;
  /** Thème effectif résolu (system → schéma OS courant). */
  resolvedScheme: "light" | "dark";
  setMode: (mode: AppearanceMode) => void;
};

export const AppearanceOverrideContext = createContext<AppearanceValue | null>(null);
const Ctx = AppearanceOverrideContext;

/**
 * Surcharge locale du thème (mémoire app, pas de persistance disque pour
 * l'instant — pas d'AsyncStorage dans le projet). Défaut : suit le système.
 */
export function AppearanceProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setMode] = useState<AppearanceMode>("system");

  const resolvedScheme: "light" | "dark" =
    mode === "system" ? (systemScheme === "light" ? "light" : "dark") : mode;

  const value = useMemo(
    () => ({ mode, resolvedScheme, setMode: (m: AppearanceMode) => setMode(m) }),
    [mode, resolvedScheme],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppearance() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAppearance hors AppearanceProvider");
  return ctx;
}
