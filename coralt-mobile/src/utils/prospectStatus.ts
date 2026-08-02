/** Normalise le statut UI renvoyé par sheet-prospects. */
export type ProspectStatusKind =
  | "pending"
  | "in_progress"
  | "validate"
  | "sent"
  | "no_contact"
  | "other";

export function prospectStatusKind(statut?: string | null): ProspectStatusKind {
  const v = String(statut || "").toLowerCase().trim();
  if (!v) return "validate";
  if (v === "sent" || v === "send" || v.includes("envoy")) return "sent";
  if (v === "no_contact" || v.includes("no contact")) return "no_contact";
  if (v === "pending") return "pending";
  if (v === "in_progress") return "in_progress";
  if (v === "validate" || v === "validated" || v === "done" || v === "ok") {
    return "validate";
  }
  return "other";
}

export function prospectStatusLabel(statut?: string | null): string {
  switch (prospectStatusKind(statut)) {
    case "sent":
      return "Envoyé";
    case "no_contact":
      return "Ne pas contacter";
    case "pending":
      return "À traiter";
    case "in_progress":
      return "En cours";
    case "validate":
      return "À contacter";
    default:
      return statut ? String(statut) : "À contacter";
  }
}

export function isSentStatut(statut?: string | null) {
  return prospectStatusKind(statut) === "sent";
}

export function isNoContactStatut(statut?: string | null) {
  return prospectStatusKind(statut) === "no_contact";
}

/** Recherche textuelle (tokens, sans accents). */
export function prospectMatchesQuery(
  p: {
    entreprise?: string;
    ville?: string;
    email?: string;
    contact?: string;
    numero?: string;
    secteur?: string;
    adresse?: string;
  },
  query: string,
): boolean {
  const q = fold(query).trim();
  if (!q) return true;
  const hay = fold(
    [p.entreprise, p.ville, p.email, p.contact, p.numero, p.secteur, p.adresse]
      .filter(Boolean)
      .join(" "),
  );
  return q.split(/\s+/).every((token) => hay.includes(token));
}

function fold(s: string) {
  return String(s || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
