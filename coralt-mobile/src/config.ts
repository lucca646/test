import Constants from "expo-constants";

/** Base API COR·ALT (dev par défaut). */
export const API_URL = (
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  "https://cal.coraia.eu"
).replace(/\/$/, "");

export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV || "development";
