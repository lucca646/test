import * as SecureStore from "expo-secure-store";

const COOKIE_KEY = "coralt_session_cookie";
const BEARER_KEY = "coralt_access_token";

/** Session cookie Flask (`coralt_session=…`) — interim tant que Bearer user n’existe pas. */
export async function getSessionCookie(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(COOKIE_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setSessionCookie(cookie: string | null): Promise<void> {
  if (!cookie) {
    await SecureStore.deleteItemAsync(COOKIE_KEY);
    return;
  }
  await SecureStore.setItemAsync(COOKIE_KEY, cookie);
}

/** Future Bearer user token (contrat étape 2). */
export async function getAccessToken(): Promise<string | null> {
  try {
    return (await SecureStore.getItemAsync(BEARER_KEY)) || null;
  } catch {
    return null;
  }
}

export async function setAccessToken(token: string | null): Promise<void> {
  if (!token) {
    await SecureStore.deleteItemAsync(BEARER_KEY);
    return;
  }
  await SecureStore.setItemAsync(BEARER_KEY, token);
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
