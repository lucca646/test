import { apiFetch } from "./http";
import { clearAuthStorage } from "./session";

export async function apiLogin(email: string, password: string) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: email, password }),
  });
  if (data.status !== "success") {
    throw new Error(
      (data.message as string) || "Connexion impossible.",
    );
  }
  return data;
}

export async function apiRegister(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  invite_code?: string;
}) {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: payload.name,
      email: payload.email,
      password: payload.password,
      phone: payload.phone || "",
      ...(payload.invite_code ? { invite_code: payload.invite_code } : {}),
    }),
  });
  if (data.status !== "success") {
    throw new Error(
      (data.message as string) || "Inscription impossible.",
    );
  }
  return data;
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
  try {
    const data = await apiFetch("/api/auth/me", {
      method: "POST",
      body: JSON.stringify({}),
    });
    if (data.status !== "success" || !data.user) return null;
    return data;
  } catch {
    return null;
  }
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
