import { apiFetch } from "./http";
import { apiRefreshUser } from "./auth";
import {
  isOnboardingOAuthReturnPath,
  markOnboardingOAuthPending,
} from "../utils/onboardingResumeBridge";

const SESSION_KEY = "coralt_session_v2";

function currentReturnPath() {
  const { pathname, search } = window.location;
  return `${pathname}${search}`;
}

function defaultGmailReturnUrl() {
  const { origin, pathname, search } = window.location;
  const current = `${origin}${pathname}${search}`;
  // Pendant l'onboarding (/recherche), toujours revenir sur cette page — pas l'URL prod par défaut.
  if (pathname.startsWith("/recherche") || pathname.startsWith("/console")) return current;
  const envUrl = import.meta.env.VITE_GMAIL_OAUTH_RETURN_URL;
  if (envUrl) return envUrl;
  return current;
}

function resolveOAuthReturnTarget(returnTo) {
  const raw = (returnTo || currentReturnPath()).trim();
  if (!raw) return defaultGmailReturnUrl();
  if (raw.startsWith("/")) return raw;
  return raw;
}

/** Redirige vers le flux OAuth Google (via Flask → email_sender :8020). */
export function connectGmail(returnTo) {
  const target = resolveOAuthReturnTarget(returnTo);

  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.email && isOnboardingOAuthReturnPath(target)) {
        markOnboardingOAuthPending(parsed.email, target.split("?")[0]);
      }
    }
  } catch {
    /* ignore */
  }

  const qs = new URLSearchParams({ return_to: target });
  window.location.href = `/api/auth/gmail?${qs.toString()}`;
}

/** Supprime les tokens OAuth en base (table clientoauth). */
export async function disconnectGmail(email) {
  const data = await apiFetch("/api/auth/disconnect-gmail", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data;
}

export async function refreshGmailStatus(email) {
  return apiRefreshUser(email);
}
