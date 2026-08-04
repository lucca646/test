import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type LocalUser = {
  id: string;
  name: string;
  role: "admin" | "vendeur";
};

/**
 * Identité **locale** (pas de session backend) — cf. `src/config.ts` :
 * l'app authentifie ses appels API avec un token serveur unique, le choix
 * ci-dessous ne sert qu'à personnaliser l'affichage (Profil, Stats…).
 * Pas de mot de passe pour l'instant, sur demande explicite.
 */
export const KNOWN_USERS: LocalUser[] = [
  { id: "lucca", name: "Lucca", role: "admin" },
  { id: "ernest", name: "Ernest", role: "vendeur" },
];

type CurrentUserValue = {
  user: LocalUser | null;
  ready: boolean;
  selectUser: (id: string) => void;
  clearUser: () => void;
};

const Ctx = createContext<CurrentUserValue | null>(null);

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<LocalUser | null>(null);

  const selectUser = useCallback((id: string) => {
    const found = KNOWN_USERS.find((u) => u.id === id) ?? null;
    setUser(found);
  }, []);

  const clearUser = useCallback(() => setUser(null), []);

  const value = useMemo(
    () => ({ user, ready: true, selectUser, clearUser }),
    [user, selectUser, clearUser],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCurrentUser() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCurrentUser hors CurrentUserProvider");
  return ctx;
}
