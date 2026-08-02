/**
 * Stockage session COR·ALT.
 *
 * Important OTA : le binaire TestFlight actuel n’embarque pas forcément
 * `expo-secure-store`. Un import statique fait crasher le JS → rollback Expo
 * vers l’ancien bundle (playground Aujourd’hui).
 *
 * → require dynamique + fallback mémoire (login à chaque cold start tant que
 *   SecureStore n’est pas dans un prochain build natif).
 */

const COOKIE_KEY = "coralt_session_cookie";
const BEARER_KEY = "coralt_access_token";

const memory = new Map<string, string>();

type KvStore = {
  getItemAsync: (key: string) => Promise<string | null>;
  setItemAsync: (key: string, value: string) => Promise<void>;
  deleteItemAsync: (key: string) => Promise<void>;
};

function memoryStore(): KvStore {
  return {
    async getItemAsync(key) {
      return memory.get(key) ?? null;
    },
    async setItemAsync(key, value) {
      memory.set(key, value);
    },
    async deleteItemAsync(key) {
      memory.delete(key);
    },
  };
}

let resolved: KvStore | null = null;

function store(): KvStore {
  if (resolved) return resolved;
  try {
    // Évite l’import statique (crash natif si module absent du binaire).
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const SecureStore = require("expo-secure-store") as KvStore;
    if (typeof SecureStore?.getItemAsync === "function") {
      resolved = {
        async getItemAsync(key) {
          try {
            return (await SecureStore.getItemAsync(key)) || null;
          } catch {
            return memory.get(key) ?? null;
          }
        },
        async setItemAsync(key, value) {
          memory.set(key, value);
          try {
            await SecureStore.setItemAsync(key, value);
          } catch {
            /* mémoire seule */
          }
        },
        async deleteItemAsync(key) {
          memory.delete(key);
          try {
            await SecureStore.deleteItemAsync(key);
          } catch {
            /* ignore */
          }
        },
      };
      return resolved;
    }
  } catch {
    /* module JS/natif indisponible */
  }
  resolved = memoryStore();
  return resolved;
}

/** Session cookie Flask (`coralt_session=…`) — interim tant que Bearer user n’existe pas. */
export async function getSessionCookie(): Promise<string | null> {
  try {
    return (await store().getItemAsync(COOKIE_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(cookie: string | null): Promise<void> {
  if (!cookie) {
    await store().deleteItemAsync(COOKIE_KEY);
    return;
  }
  await store().setItemAsync(COOKIE_KEY, cookie);
}

/** Future Bearer user token (contrat étape 2). */
export async function getAccessToken(): Promise<string | null> {
  try {
    return (await store().getItemAsync(BEARER_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (!token) {
    await store().deleteItemAsync(BEARER_KEY);
    return;
  }
  await store().setItemAsync(BEARER_KEY, token);
}

export async function clearAuthStorage(): Promise<void> {
  await setSessionCookie(null);
  await setAccessToken(null);
}

/** Extrait `coralt_session=…` depuis Set-Cookie (RN expose souvent le header). */
export function extractCoraltSessionCookie(
  setCookie: string | null | undefined,
): string | null {
  if (!setCookie) return null;
  const parts = setCookie.split(/,(?=\s*[^;=]+=)/);
  for (const part of parts) {
    const m = part.match(/^\s*(coralt_session=[^;]+)/i);
    if (m) return m[1];
  }
  const m2 = setCookie.match(/coralt_session=[^;]+/i);
  return m2 ? m2[0] : null;
}
