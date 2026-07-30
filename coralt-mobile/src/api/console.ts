import { apiFetch } from "./http";

export async function apiNafSuggest(q: string) {
  return apiFetch(`/api/naf-suggest?secteur=${encodeURIComponent(q)}`);
}

export async function apiGeoCatalog() {
  return apiFetch("/api/geo-zones/catalog");
}

export async function apiSearchProfileCompose(body: Record<string, unknown>) {
  return apiFetch("/api/search-profile/compose", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiSendSearch(body: Record<string, unknown>) {
  return apiFetch("/api/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function apiSearchQueueStatus(params = "") {
  const qs = params.startsWith("?") ? params : params ? `?${params}` : "";
  return apiFetch(`/api/search-queue/status${qs}`);
}
