import Constants from "expo-constants";

/** API COR·ALT (prod / host joignable). */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "https://cal.coraia.eu"
).replace(/\/$/, "");

/**
 * Bridge session (lit Set-Cookie serveur → JSON).
 * Requis sur mobile : le cookie HttpOnly n’est pas exposé au JS.
 * Prod : même host que l’API (`/bridge/*` → :8791).
 */
export const BRIDGE_URL = (
  process.env.EXPO_PUBLIC_BRIDGE_URL ||
  Constants.expoConfig?.extra?.bridgeUrl ||
  "https://cal.coraia.eu"
).replace(/\/$/, "");

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || "development";

/**
 * Backend Messages (CRM SMS COR·ALT — `mcp/src/imessage-server.ts`).
 * Service distinct de l'API COR·ALT (`API_URL` ci-dessus).
 * Exposé en HTTPS via `simbot.coraia.eu` (nginx-proxy-manager → :8521,
 * cert Let's Encrypt) — pas d'exception ATS nécessaire.
 *
 * Auth : token serveur (même niveau que n8n) envoyé en Bearer sur chaque
 * requête — pas de mot de passe utilisateur pour l'instant. Le choix
 * « Lucca / Ernest » (`src/messages/CurrentUserContext.tsx`) est une
 * identité locale d'affichage, pas une session backend.
 */
export const MESSAGES_API_URL = (
  process.env.EXPO_PUBLIC_MESSAGES_API_URL ||
  Constants.expoConfig?.extra?.messagesApiUrl ||
  "https://simbot.coraia.eu"
).replace(/\/$/, "");

export const MESSAGES_API_TOKEN =
  process.env.EXPO_PUBLIC_MESSAGES_API_TOKEN ||
  Constants.expoConfig?.extra?.messagesApiToken ||
  "";
