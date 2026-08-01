import Constants from "expo-constants";

/** API COR·ALT (prod / host joignable). */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "https://cal.coraia.eu"
).replace(/\/$/, "");

/**
 * Bridge session (lit Set-Cookie serveur → JSON).
 * Requis sur Expo Go : le cookie HttpOnly n’est pas exposé au JS.
 */
export const BRIDGE_URL = (
  process.env.EXPO_PUBLIC_BRIDGE_URL ||
  Constants.expoConfig?.extra?.bridgeUrl ||
  ""
).replace(/\/$/, "");

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || "development";
