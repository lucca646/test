import { apiFetch } from "./http";

export async function apiNafSuggest(q: string) {
  return apiFetch(`/api/naf-suggest?secteur=${encodeURIComponent(q)}`);
}

export async function apiGeoCatalog() {
  return apiFetch("/api/geo-zones/catalog");
}

export async function apiGeoCommunes(q: string) {
  return apiFetch(`/api/geo-zones/communes?q=${encodeURIComponent(q)}`);
}

export async function apiSearchProfileCompose(body: Record<string, unknown>) {
  return apiFetch("/api/search-profile/compose", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 90_000,
  });
}

export async function apiSearchProfileAnalyze(body: Record<string, unknown>) {
  return apiFetch("/api/search-profile/analyze", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 90_000,
  });
}

export async function apiSendSearch(body: Record<string, unknown>) {
  return apiFetch("/api/send", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 60_000,
  });
}

export async function apiSearchQueueStatus(email?: string) {
  const qs = email ? `?email=${encodeURIComponent(email)}` : "";
  return apiFetch(`/api/search-queue/status${qs}`);
}

export async function apiSearchQueueState(email?: string) {
  const qs = email ? `?email=${encodeURIComponent(email)}` : "";
  return apiFetch(`/api/search-queue/state${qs}`);
}
