import { apiFetch } from "./http";

export async function apiAppConfig() {
  return apiFetch("/api/config");
}
