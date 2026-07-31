import { apiFetch } from "./http";

export type Prospect = {
  id?: string | number;
  row_index?: string | number;
  entreprise?: string;
  email?: string;
  ville?: string;
  numero?: string;
  contact?: string;
  statut?: string;
  secteur?: string;
  taille?: string;
  adresse?: string;
  lien?: string;
  mailSubject?: string;
  mailBody?: string;
  repondu?: string | null;
  hasEmail?: boolean;
  hasPhone?: boolean;
};

export async function fetchSheetProspects(
  opts: {
    email?: string;
    for_swipe?: boolean;
    limit?: number;
    offset?: number;
  } = {},
) {
  const pageSize = opts.limit ?? (opts.for_swipe ? 50 : 200);
  const all: Prospect[] = [];
  let offset = opts.offset ?? 0;
  let total = 0;
  let mirror: unknown = null;

  for (;;) {
    const qs = new URLSearchParams({
      limit: String(pageSize),
      offset: String(offset),
    });
    if (opts.email) qs.set("email", opts.email);
    if (opts.for_swipe) qs.set("for_swipe", "1");

    const data = await apiFetch(`/api/plan3/sheet-prospects?${qs.toString()}`, {
      timeoutMs: opts.for_swipe ? 45_000 : 90_000,
    });
    const chunk = (data.prospects as Prospect[]) || [];
    all.push(...chunk);
    mirror = data.mirror ?? mirror;
    total = Number(data.total ?? all.length);
    if (!data.has_more || chunk.length === 0) break;
    offset += pageSize;
    // mobile : une page suffit souvent pour l’UI initiale
    if (!opts.for_swipe && all.length >= pageSize) break;
  }

  return { prospects: all, total, mirror };
}

export async function sendProspectMail(body: {
  email: string;
  row_index: string | number;
  subject: string;
  body: string;
  target_email?: string;
  force?: boolean;
}) {
  return apiFetch("/api/plan3/sheet-prospects/send", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 60_000,
  });
}

export async function updateProspectStatus(body: {
  email: string;
  row_index: string | number;
  action: "sent" | "to_contact" | "no_contact" | "validate" | "relancer";
}) {
  return apiFetch("/api/plan3/sheet-prospects/status", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function deleteProspect(body: {
  email: string;
  row_index: string | number;
}) {
  return apiFetch("/api/plan3/sheet-prospects", {
    method: "DELETE",
    body: JSON.stringify(body),
  });
}

export async function regenerateMail(body: {
  email: string;
  row_index: string | number;
}) {
  return apiFetch("/api/plan3/sheet-prospects/mail/regenerate", {
    method: "POST",
    body: JSON.stringify(body),
    timeoutMs: 90_000,
  });
}
