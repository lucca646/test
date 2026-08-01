import { apiFetch } from "./http";

/** GET /api/naf-suggest?secteur= — identique V1 */
export async function fetchNafSuggestions(secteur) {
  const q = (secteur || "").trim();
  if (!q) return { suggestions: [], corrected_query: null };

  const data = await apiFetch(`/api/naf-suggest?secteur=${encodeURIComponent(q)}`);
  return {
    suggestions: data.suggestions || [],
    corrected_query: data.corrected_query || null,
  };
}

/** POST /api/naf-onboarding-themes — thèmes NAF extraits du profil (onboarding) */
export async function fetchNafOnboardingThemes(profileText) {
  const data = await apiFetch("/api/naf-onboarding-themes", {
    method: "POST",
    body: JSON.stringify({ profile_text: profileText }),
  });
  return data.themes || [];
}

/** GET /api/geo-zones/catalog — départements et régions */
export async function fetchGeoCatalog() {
  const data = await apiFetch("/api/geo-zones/catalog");
  if (data.status !== "success") {
    throw new Error(data.message || "Catalogue géographique indisponible.");
  }
  return data;
}

/** GET /api/geo-zones/communes?q= — autocomplétion villes */
export async function searchGeoCommunes(query, { signal } = {}) {
  const q = (query || "").trim();
  if (q.length < 2) return [];
  const data = await apiFetch(`/api/geo-zones/communes?q=${encodeURIComponent(q)}`, { signal });
  return data.communes || [];
}

/** POST /api/geo-zones/resolve — texte libre, une zone ou plusieurs (zones: []) */
export async function resolveGeoZones(queryOrBody, { signal } = {}) {
  let body;
  if (Array.isArray(queryOrBody)) {
    body = { zones: queryOrBody };
  } else if (typeof queryOrBody === "object" && queryOrBody !== null) {
    body = queryOrBody;
  } else {
    body = { query: (queryOrBody || "").trim() };
  }

  const data = await apiFetch("/api/geo-zones/resolve", {
    method: "POST",
    body: JSON.stringify(body),
    signal,
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Zone non reconnue.");
  }
  return data;
}

/** POST /api/search-profile/analyze — analyse IA du profil de recherche */
export async function analyzeSearchProfile(text, { geoQuery, fast = false, skipApe = false } = {}) {
  const body = { text: (text || "").trim(), fast: Boolean(fast), skip_ape: Boolean(skipApe) };
  if (geoQuery?.trim()) body.geo_query = geoQuery.trim();
  const data = await apiFetch("/api/search-profile/analyze", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 240000,
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Analyse impossible.");
  }
  return data;
}

/** POST /api/search-profile/compose — onboarding → texte (+ APE si fast=false) */
export async function composeSearchProfile(answers, { email, skipApe = false } = {}) {
  const data = await apiFetch("/api/search-profile/compose", {
    method: "POST",
    body: JSON.stringify({
      answers,
      email: email || undefined,
      skip_ape: Boolean(skipApe),
    }),
    timeoutMs: skipApe ? 90000 : 240000,
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Génération du profil impossible.");
  }
  return data;
}

/** POST /api/send — identique V1 */
export async function sendConsoleSearch(payload) {
  return apiFetch("/api/send", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** GET /api/search-queue/status — progression file APE × zone */
export async function fetchSearchQueueStatus(campaignId, email) {
  const params = new URLSearchParams({ campaign_id: String(campaignId) });
  if (email) params.set("email", email);
  const data = await apiFetch(`/api/search-queue/status?${params}`);
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible de lire la progression.");
  }
  return data.campaign;
}

/** GET /api/search-queue/state — pause utilisateur + campagne active */
export async function fetchSearchQueueState(email) {
  const params = new URLSearchParams({ email: (email || "").trim() });
  return apiFetch(`/api/search-queue/state?${params}`);
}

/** POST /api/search-queue/preview — jauge selon zones + codes APE actuels */
export async function fetchSearchQueuePreview(payload) {
  const data = await apiFetch("/api/search-queue/preview", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Aperçu indisponible.");
  }
  return data;
}

/** PATCH /api/search-queue/pause — ON/OFF traitement file */
export async function setSearchQueuePaused(email, paused) {
  return apiFetch("/api/search-queue/pause", {
    method: "PATCH",
    body: JSON.stringify({ email: (email || "").trim(), paused: Boolean(paused) }),
  });
}

/** POST /api/search-queue/cancel — arrête les tâches en attente / en cours */
export async function cancelSearchQueue(email, reason = "criteria_changed") {
  const data = await apiFetch("/api/search-queue/cancel", {
    method: "POST",
    body: JSON.stringify({
      email: (email || "").trim(),
      reason: reason || "criteria_changed",
    }),
  });
  if (data.status !== "success") {
    throw new Error(data.message || "Impossible d'annuler la recherche.");
  }
  return data;
}
