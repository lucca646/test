import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  apiLogin,
  apiLogout,
  apiRefreshUser,
  apiRegister,
} from "../api/auth";
import { coerceBool } from "../utils/bool";
import { isAccountActivated } from "../utils/accountActivation";
import type { CoraltUser } from "../utils/planAccess";

type AuthContextValue = {
  user: CoraltUser | null;
  authReady: boolean;
  activated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: {
    name: string;
    email: string;
    password: string;
    phone?: string;
    invite_code?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<CoraltUser | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function normalizeUser(u: CoraltUser | null): CoraltUser | null {
  if (!u) return null;
  const plan = Number(u.plan);
  return {
    ...u,
    plan: Number.isFinite(plan) && plan >= 1 ? plan : 1,
    account_activated:
      u.is_admin === true || coerceBool(u.account_activated, false),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<CoraltUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  const refreshUser = useCallback(async () => {
    const data = await apiRefreshUser();
    const next = normalizeUser((data?.user as CoraltUser) || null);
    setUser(next);
    return next;
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiRefreshUser();
        if (!cancelled) {
          setUser(normalizeUser((data?.user as CoraltUser) || null));
        }
      } catch {
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiLogin(email, password);
    setUser(normalizeUser((data.user as CoraltUser) || null));
  }, []);

  const register = useCallback(
    async (payload: {
      name: string;
      email: string;
      password: string;
      phone?: string;
      invite_code?: string;
    }) => {
      const data = await apiRegister(payload);
      setUser(normalizeUser((data.user as CoraltUser) || null));
    },
    [],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      authReady,
      activated: isAccountActivated(user),
      login,
      register,
      logout,
      refreshUser,
    }),
    [user, authReady, login, register, logout, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth hors AuthProvider");
  return ctx;
}
