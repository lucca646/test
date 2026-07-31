import { API_URL, BRIDGE_URL } from "../config";
import {
  extractCoraltSessionCookie,
  getAccessToken,
  getSessionCookie,
  setAccessToken,
  setSessionCookie,
} from "./session";

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(message: string, status: number, payload: unknown = null) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

type ApiFetchOptions = RequestInit & { timeoutMs?: number };

/**
 * Appels API COR·ALT.
 *
 * Sur Expo Go, le header Cookie est souvent strippé par RN.
 * → on passe par le bridge avec X-Coralt-Session (SecureStore).
 */
export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  const { timeoutMs, headers: optHeaders, ...fetchOptions } = options;
  const controller = timeoutMs ? new AbortController() : null;
  const timer =
    controller &&
    setTimeout(() => {
      controller.abort();
    }, timeoutMs);

  const isFormData =
    typeof FormData !== "undefined" && fetchOptions.body instanceof FormData;

  const [bearer, cookie] = await Promise.all([
    getAccessToken(),
    getSessionCookie(),
  ]);

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(optHeaders as Record<string, string>),
  };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;

  // Session via header custom (RN ne strippe pas X-*)
  if (cookie) {
    headers["X-Coralt-Session"] = cookie.startsWith("coralt_session=")
      ? cookie
      : `coralt_session=${cookie}`;
  }

  const relative = path.startsWith("http")
    ? path
    : path.startsWith("/")
      ? path
      : `/${path}`;

  let url: string;
  if (path.startsWith("http")) {
    url = path;
  } else if (BRIDGE_URL) {
    // /api/foo → bridge /bridge/proxy/api/foo
    url = `${BRIDGE_URL}/bridge/proxy${relative}`;
  } else {
    url = `${API_URL}${relative}`;
  }

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
      credentials: "omit",
      signal: controller?.signal,
    });
  } catch (err) {
    if (timer) clearTimeout(timer);
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(
        `Délai dépassé (${Math.round((timeoutMs || 0) / 1000)} s).`,
      );
    }
    throw err;
  }
  if (timer) clearTimeout(timer);

  const setCookie =
    res.headers.get("set-cookie") ||
    res.headers.get("Set-Cookie") ||
    res.headers.get("x-coralt-session") ||
    res.headers.get("X-Coralt-Session");
  const session = extractCoraltSessionCookie(setCookie);
  if (session) await setSessionCookie(session);

  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    if (!res.ok) {
      throw new ApiError(`Erreur serveur (${res.status})`, res.status);
    }
    return { status: "success" };
  }

  if (typeof data.access_token === "string" && data.access_token) {
    await setAccessToken(data.access_token);
  }
  if (typeof data.session_cookie === "string" && data.session_cookie) {
    await setSessionCookie(data.session_cookie);
  }

  if (!res.ok) {
    const msg =
      (typeof data.message === "string" && data.message) ||
      `Erreur ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data;
}
