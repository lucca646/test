/**
 * Stockage session COR·ALT (OTA-safe).
 *
 * Le binaire TestFlight actuel n’embarque PAS `expo-secure-store`
 * (absent du package.json au moment du build). Tout chargement de ce
 * module — import statique OU `require()` — exécute
 * `requireNativeModule('ExpoSecureStore')` et peut crasher le JS
 * → Expo Updates rollback vers l’ancien playground.
 *
 * → mémoire process uniquement jusqu’au prochain build natif qui
 *   inclura expo-secure-store (+ plugin app.json).
 */

const COOKIE_KEY = "coralt_session_cookie";
const BEARER_KEY = "coralt_access_token";

const memory = new Map<string, string>();

async function getItem(key: string): Promise<string | null> {
  return memory.get(key) ?? null;
}

async function setItem(key: string, value: string): Promise<void> {
  memory.set(key, value);
}

async function deleteItem(key: string): Promise<void> {
  memory.delete(key);
}

/** Session cookie Flask (`coralt_session=…`) — interim tant que Bearer user n’existe pas. */
export async function getSessionCookie(): Promise<string | null> {
  try {
    return (await getItem(COOKIE_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(cookie: string | null): Promise<void> {
  if (!cookie) {
    await deleteItem(COOKIE_KEY);
    return;
  }
  await setItem(COOKIE_KEY, cookie);
}

/** Future Bearer user token (contrat étape 2). */
export async function getAccessToken(): Promise<string | null> {
  try {
    return (await getItem(BEARER_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (!token) {
    await deleteItem(BEARER_KEY);
    return;
  }
  await setItem(BEARER_KEY, token);
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
