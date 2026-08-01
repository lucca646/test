import { apiFetch } from "./http";

export async function fetchTemplates(email) {
  const data = await apiFetch(`/api/plan3/templates?email=${encodeURIComponent(email)}`);
  return data.templates || [];
}

export async function saveTemplate({ email, id, name, subject, body }) {
  await apiFetch("/api/plan3/templates", {
    method: "POST",
    body: JSON.stringify({ email, id: id || undefined, name, subject, body }),
  });
}

export async function deleteTemplate(email, templateId) {
  await apiFetch(
    `/api/plan3/templates/${templateId}?email=${encodeURIComponent(email)}`,
    { method: "DELETE" },
  );
}

export async function fetchBlacklist(email) {
  const data = await apiFetch(`/api/plan3/blacklist?email=${encodeURIComponent(email)}`);
  return data.blacklist || [];
}

export async function addBlacklist(userEmail, targetEmail) {
  await apiFetch("/api/plan3/blacklist", {
    method: "POST",
    body: JSON.stringify({ user_email: userEmail, email: targetEmail }),
  });
}

export async function removeBlacklist(email, itemId) {
  await apiFetch(
    `/api/plan3/blacklist/${itemId}?email=${encodeURIComponent(email)}`,
    { method: "DELETE" },
  );
}

export async function fetchPrompts(email) {
  const data = await apiFetch(`/api/plan3/prompts?email=${encodeURIComponent(email)}`);
  return data.prompts || [];
}

export async function savePrompt({ email, id, name, body }) {
  await apiFetch("/api/plan3/prompts", {
    method: "POST",
    body: JSON.stringify({ email, id: id || undefined, name, body }),
  });
}

export async function deletePrompt(email, promptId) {
  await apiFetch(
    `/api/plan3/prompts/${promptId}?email=${encodeURIComponent(email)}`,
    { method: "DELETE" },
  );
}

export async function saveMailingComposeSettings({
  email,
  mail_use_ai,
  selected_template_id,
  selected_prompt_id,
}) {
  await apiFetch("/api/plan3/mailing-compose", {
    method: "POST",
    body: JSON.stringify({
      email,
      mail_use_ai,
      selected_template_id,
      selected_prompt_id,
    }),
  });
}

export async function fetchSheetProspects(email, { forSwipe = false } = {}) {
  const pageSize = 1000;
  const all = [];
  let offset = 0;
  let mirror = null;
  let total = 0;

  for (;;) {
    const qs = new URLSearchParams({
      email,
      limit: String(pageSize),
      offset: String(offset),
    });
    if (forSwipe) qs.set("for_swipe", "1");
    const data = await apiFetch(`/api/plan3/sheet-prospects?${qs.toString()}`, {
      // Mobile + gros tableaux : évite un spinner infini sans feedback.
      timeoutMs: forSwipe ? 45_000 : 90_000,
    });
    const chunk = data.prospects || [];
    all.push(...chunk);
    mirror = data.mirror || mirror;
    total = Number(data.total ?? all.length);
    if (!data.has_more || chunk.length === 0) {
      break;
    }
    offset += pageSize;
  }

  return {
    prospects: all,
    mirror,
    fromCache: true,
    total,
  };
}

/** Marque si le contact a répondu (base interne uniquement). repondu: "yes" | "no" | null */
export async function updateProspectRepondu({ email, row_index, repondu }) {
  return apiFetch("/api/plan3/sheet-prospects/repondu", {
    method: "POST",
    body: JSON.stringify({ email, row_index, repondu: repondu ?? "" }),
  });
}

/** Met à jour les champs éditables d'une fiche (Sheet + champs locaux repondu). */
export async function updateProspectFields({ email, row_index, fields }) {
  return apiFetch("/api/plan3/sheet-prospects/update", {
    method: "POST",
    body: JSON.stringify({ email, row_index, fields }),
  });
}

/** Notes personnelles (base interne uniquement). */
export async function updateProspectNotePerso({ email, row_index, note }) {
  return apiFetch("/api/plan3/sheet-prospects/note-perso", {
    method: "POST",
    body: JSON.stringify({ email, row_index, note: note ?? "" }),
  });
}

/** Met à jour STATUS dans le Sheet (OK → VALIDATED, etc.). */
export async function updateSheetProspectStatus(email, rowIndex, action) {
  const data = await apiFetch("/api/plan3/sheet-prospects/status", {
    method: "POST",
    body: JSON.stringify({ email, row_index: rowIndex, action }),
  });
  return data;
}

/** Vide STATUS sur le Sheet et dans le miroir local (relance une ligne « en cours »). */
export async function restartSheetProspect({ email, row_index }) {
  return updateSheetProspectStatus(email, row_index, "relancer");
}

/** Enregistre objet + corps dans le Google Sheet. */
export async function saveProspectMail({ email, row_index, subject, body }) {
  return apiFetch("/api/plan3/sheet-prospects/mail", {
    method: "POST",
    body: JSON.stringify({ email, row_index, subject, body }),
  });
}

/** Régénère un mail (IA) — consignes optionnelles pour affiner le texte existant. */
export async function regenerateProspectMail({
  email,
  row_index,
  subject,
  body,
  instructions = "",
}) {
  return apiFetch("/api/plan3/sheet-prospects/mail", {
    method: "POST",
    body: JSON.stringify({
      email,
      row_index,
      subject,
      body,
      instructions,
      regenerate: true,
    }),
    timeoutMs: 120000,
  });
}

/** Envoie le mail via Gmail et passe le statut à SENT. force=true contourne le blocage doublon. */
export async function sendProspectMail({
  email,
  row_index,
  subject,
  body,
  target_email,
  force = false,
}) {
  try {
    return await apiFetch("/api/plan3/sheet-prospects/send", {
      method: "POST",
      body: JSON.stringify({ email, row_index, subject, body, target_email, force }),
    });
  } catch (err) {
    if (err.status === 409 && (err.payload?.status === "already_sent" || err.payload?.code === "already_sent")) {
      const wrapped = new Error(
        err.payload.message || "Un mail a déjà été envoyé à cette adresse.",
      );
      wrapped.status = 409;
      wrapped.code = "already_sent";
      wrapped.priorSends = err.payload.prior_sends || [];
      throw wrapped;
    }
    throw err;
  }
}

/** Supprime définitivement une ligne du Google Sheet. */
export async function deleteSheetProspect({ email, row_index }) {
  return apiFetch("/api/plan3/sheet-prospects", {
    method: "DELETE",
    body: JSON.stringify({ email, row_index }),
  });
}

/** Supprime le brouillon et marque NO CONTACT. */
export async function deleteProspectMail({ email, row_index }) {
  return apiFetch("/api/plan3/sheet-prospects/mail", {
    method: "DELETE",
    body: JSON.stringify({ email, row_index }),
  });
}

export async function fetchMailingStatus() {
  return apiFetch("/api/plan3/mailing-status");
}

/** État worker enrichissement (lignes en attente, erreur n8n, prochain passage). */
export async function fetchEnrichmentStatus() {
  return apiFetch("/api/enrichment/status");
}

/** Lance un cycle d'enrichissement immédiat (plan ≥ 2). */
export async function triggerEnrichmentRun({ force = false } = {}) {
  return apiFetch("/api/enrichment/run", {
    method: "POST",
    body: JSON.stringify({ force }),
    timeoutMs: 180000,
  });
}

export async function saveMailingControl({
  email,
  mail_sending_enabled,
  mail_test_mode,
  send_mode,
}) {
  const body = { email };
  if (mail_sending_enabled !== undefined) body.mail_sending_enabled = mail_sending_enabled;
  if (mail_test_mode !== undefined) body.mail_test_mode = mail_test_mode;
  if (send_mode !== undefined) body.send_mode = send_mode;
  const data = await apiFetch("/api/plan3/mailing-control", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.user;
}

export async function savePlan3Settings({
  email,
  send_mode,
  send_timeslot,
  mail_test_mode,
  search_domain,
  search_naf_codes,
  search_profile_json,
  search_geo_zones,
}) {
  const body = { email, send_mode };
  if (send_timeslot !== undefined) body.send_timeslot = send_timeslot;
  if (mail_test_mode !== undefined) body.mail_test_mode = mail_test_mode;
  if (search_domain !== undefined) body.search_domain = search_domain;
  if (search_naf_codes !== undefined) body.search_naf_codes = search_naf_codes;
  if (search_profile_json !== undefined) body.search_profile_json = search_profile_json;
  if (search_geo_zones !== undefined) body.search_geo_zones = search_geo_zones;
  const data = await apiFetch("/api/plan3/settings", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.user;
}
