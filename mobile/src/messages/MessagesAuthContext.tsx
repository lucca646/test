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
  messagesLogin,
  messagesLogout,
  messagesMe,
  type MessagesUser,
} from "./api";

type MessagesAuthValue = {
  user: MessagesUser | null;
  authReady: boolean;
  login: (login: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const Ctx = createContext<MessagesAuthValue | null>(null);

export function MessagesAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MessagesUser | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await messagesMe();
      if (!cancelled) {
        setUser(me);
        setAuthReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (login: string, password: string) => {
    const { user: next } = await messagesLogin(login, password);
    setUser(next);
  }, []);

  const logout = useCallback(async () => {
    await messagesLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, authReady, login, logout }),
    [user, authReady, login, logout],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMessagesAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useMessagesAuth hors MessagesAuthProvider");
  return ctx;
}
