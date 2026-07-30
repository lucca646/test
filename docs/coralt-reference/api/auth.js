import { apiFetch } from "./http";

/** POST /api/auth/login — backend attend `login` (email ou nom) */
export async function apiLogin(email, password) {
  const data = await apiFetch("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ login: email, password }),
  });
  if (data.status !== "success") throw new Error(data.message || "Connexion impossible.");
  return data;
}

/** POST /api/auth/register */
export async function apiRegister({ name, email, password, phone, invite_code }) {
  const data = await apiFetch("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
      phone,
      ...(invite_code ? { invite_code } : {}),
    }),
  });
  if (data.status !== "success") throw new Error(data.message || "Inscription impossible.");
  return data;
}

/** POST /api/auth/logout — invalide la session serveur */
export async function apiLogout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST", body: JSON.stringify({}) });
  } catch {
    /* déconnexion locale même si le réseau échoue */
  }
}

/** POST /api/auth/me — profil depuis la session serveur (cookie). */
export async function apiRefreshUser() {
  const data = await apiFetch("/api/auth/me", {
    method: "POST",
    body: JSON.stringify({}),
  });
  if (data.status !== "success" || !data.user) return null;
  return data;
}

/** POST /api/auth/update — nom, téléphone, mot de passe (email et plan non modifiables). */
export async function apiUpdateProfile({
  email,
  name,
  phone,
  password,
  current_password,
  competence_highlight,
  skills_list,
}) {
  const body = { email };
  if (name !== undefined) body.name = name;
  if (phone !== undefined) body.phone = phone;
  if (password !== undefined) body.password = password;
  if (current_password !== undefined) body.current_password = current_password;
  if (competence_highlight !== undefined) body.competence_highlight = competence_highlight;
  if (skills_list !== undefined) body.skills_list = skills_list;

  const data = await apiFetch("/api/auth/update", {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (data.status !== "success") throw new Error(data.message || "Mise à jour impossible.");
  return data.user;
}

/** POST /api/auth/request-plan — demande d'activation avec choix de plan. */
export async function apiRequestPlan(plan) {
  const data = await apiFetch("/api/auth/request-plan", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
  if (data.status !== "success") throw new Error(data.message || "Demande impossible.");
  return data;
}
