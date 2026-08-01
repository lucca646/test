import { API_URL, BRIDGE_URL } from "../config";
import { clearAuthStorage, setSessionCookie } from "./session";
import { apiFetch } from "./http";

async function bridgePost(path: string, body: Record<string, unknown>) {
  if (!BRIDGE_URL) {
    throw new Error(
      "Bridge session absent (EXPO_PUBLIC_BRIDGE_URL). Relance Metro avec le bridge.",
    );
  }
  const res = await fetch(`${BRIDGE_URL}${path}`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  let data: Record<string, unknown> = {};
  try {
    data = (await res.json()) as Record<string, unknown>;
  } catch {
    throw new Error(`Bridge: réponse invalide (${res.status})`);
  }
  if (!res.ok || data.status === "error") {
    throw new Error(
      (typeof data.message === "string" && data.message) ||
        `Erreur ${res.status}`,
    );
  }
  if (typeof data.session_cookie === "string" && data.session_cookie) {
    await setSessionCookie(data.session_cookie);
  } else {
    throw new Error(
      "Connexion OK mais session_cookie manquant (bridge / Set-Cookie).",
    );
  }
  return data;
}

export async function apiLogin(email: string, password: string) {
  // Toujours via bridge sur mobile — cookie HttpOnly illisible en RN
  return bridgePost("/bridge/login", { login: email, password });
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  invite_code?: string;
}) {
  return bridgePost("/bridge/register", {
    name: payload.name,
    email: payload.email,
    password: payload.password,
    phone: payload.phone || "",
    ...(payload.invite_code ? { invite_code: payload.invite_code } : {}),
  });
}

export async function apiLogout() {
  try {
    await apiFetch("/api/auth/logout", {
      method: "POST",
      body: JSON.stringify({}),
    });
  } catch {
    /* ignore */
  }
  await clearAuthStorage();
}

export async function apiRefreshUser() {
  const data = await apiFetch("/api/auth/me", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (data.status !== "success") return null;
  return data;
}

export async function apiUpdateProfile(body: Record<string, unknown>) {
  const data = await apiFetch("/api/auth/update", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data.status !== "success") {
    throw new Error((data.message as string) || "Mise à jour impossible.");
  }
  return data.user;
}

export function getApiBaseLabel() {
  return `${API_URL.replace("https://", "")}${BRIDGE_URL ? " · bridge" : ""}`;
}
