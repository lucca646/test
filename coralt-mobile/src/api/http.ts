import { API_URL } from "../config";
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
 * Client HTTP mobile.
 * - Base : EXPO_PUBLIC_API_URL
 * - Auth : Bearer (si token) sinon Cookie session Flask
 * - Persiste Set-Cookie / access_token éventuel après login
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
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(optHeaders as Record<string, string>),
  };
  if (bearer) headers.Authorization = `Bearer ${bearer}`;
  else if (cookie) headers.Cookie = cookie;

  const url = path.startsWith("http") ? path : `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...fetchOptions,
      headers,
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

  // Persistance session / token
  const setCookie =
    res.headers.get("set-cookie") || res.headers.get("Set-Cookie");
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

  // Contrat futur : login renvoie access_token
  if (typeof data.access_token === "string" && data.access_token) {
    await setAccessToken(data.access_token);
  }

  if (!res.ok) {
    const msg =
      (typeof data.message === "string" && data.message) ||
      `Erreur ${res.status}`;
    throw new ApiError(msg, res.status, data);
  }

  return data;
}
