import { apiFetch } from "./http";

/** GET /api/config — instance prod / dev */
export async function apiAppConfig() {
  return apiFetch("/api/config");
}
