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
 * Service distinct de l'API COR·ALT (`API_URL` ci-dessus) : pas de bridge
 * cookie nécessaire, la session utilise un Bearer token classique.
 * Servi en clair (pas de TLS) → exception ATS ajoutée dans app.json.
 */
export const MESSAGES_API_URL = (
  process.env.EXPO_PUBLIC_MESSAGES_API_URL ||
  Constants.expoConfig?.extra?.messagesApiUrl ||
  "http://46.62.139.238:8008"
).replace(/\/$/, "");
