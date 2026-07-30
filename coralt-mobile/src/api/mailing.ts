import { apiFetch } from "./http";

export async function fetchSheetProspects(
  opts: {
    email?: string;
    for_swipe?: boolean;
    status?: string;
    limit?: number;
  } = {},
) {
  const qs = new URLSearchParams();
  if (opts.email) qs.set("email", opts.email);
  if (opts.for_swipe) qs.set("for_swipe", "1");
  if (opts.status) qs.set("status", opts.status);
  if (opts.limit) qs.set("limit", String(opts.limit));
  return apiFetch(`/api/plan3/sheet-prospects?${qs.toString()}`, {
    timeoutMs: 60_000,
  });
}

export async function sendProspectMail(body: Record<string, unknown>) {
  return apiFetch("/api/plan3/sheet-prospects/send", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function updateProspectStatus(body: Record<string, unknown>) {
  return apiFetch("/api/plan3/sheet-prospects/status", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
