/** Initiales pour l'avatar (façon Apple Messages), ex. "Jean Dupont" → "JD". */
export function initials(name: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "?";
  if (/^\+?\d[\d\s]*$/.test(trimmed)) return trimmed.replace(/\D/g, "").slice(-2) || "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Couleur d'avatar stable par numéro/nom (même palette que la PWA Messages). */
const AVATAR_PALETTE = [
  "#007aff",
  "#34c759",
  "#ff9500",
  "#af52de",
  "#ff2d55",
  "#5ac8fa",
  "#ff6b35",
  "#30b0c7",
];
export function avatarColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}

/** Parse la date serveur "YYYY-MM-DD HH:MM:SS" (UTC) en Date. */
export function parseServerDate(raw?: string | null): Date | null {
  if (!raw) return null;
  const iso = raw.includes("T") ? raw : `${raw.replace(" ", "T")}Z`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Heure/date courte pour la liste des conversations. */
export function formatListTimestamp(raw?: string | null): string {
  const d = parseServerDate(raw);
  if (!d) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) {
    return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  }
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (diffDays < 7) {
    return d.toLocaleDateString("fr-FR", { weekday: "short" }).replace(".", "");
  }
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

/** Libellé de séparateur de jour dans le fil (identique à la PWA : pas d'heure ici). */
export function formatDaySeparator(raw?: string | null): string {
  const d = parseServerDate(raw);
  if (!d) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) return "Aujourd’hui";
  if (d.toDateString() === yesterday.toDateString()) return "Hier";
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

export function formatBubbleTime(raw?: string | null): string {
  const d = parseServerDate(raw);
  if (!d) return "";
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Numéro FR affiché en +33 X XX XX XX XX. */
export function formatDisplayPhone(raw: string): string {
  const digits = String(raw || "").replace(/\D/g, "");
  let national = digits;
  if (digits.startsWith("33") && digits.length >= 11) national = `0${digits.slice(2, 11)}`;
  else if (digits.length === 9) national = `0${digits}`;
  if (national.length !== 10) return raw;
  return `+33 ${national.slice(1, 2)} ${national.slice(2, 4)} ${national.slice(4, 6)} ${national.slice(6, 8)} ${national.slice(8, 10)}`;
}

/** Couleurs des étiquettes CRM — identiques à la PWA Messages. */
const LABEL_COLORS: Record<string, string> = {
  LinkedIn: "#6366f1",
  "Gagné": "#ca8a04",
  Vendu: "#db2777",
  "Appelé": "#ea580c",
  Manuel: "#64748b",
  Nouveau: "#94a3b8",
  "À qualifier": "#f59e0b",
  "Découverte": "#3b82f6",
  "Projet identifié": "#8b5cf6",
  "Recherche active": "#0ea5e9",
  "Intéressé": "#22c55e",
  Chaud: "#16a34a",
  Client: "#15803d",
  "À relancer": "#eab308",
  Refus: "#ef4444",
};
export function labelColor(name: string): string {
  return LABEL_COLORS[name] || "#8e8e93";
}

/** Catégories CRM (statut de qualification) — mêmes libellés que le backend. */
export const CATEGORY_OPTIONS: { id: string; label: string }[] = [
  { id: "nouveau", label: "Nouveau" },
  { id: "a_qualifier", label: "À qualifier" },
  { id: "decouverte", label: "Découverte" },
  { id: "projet_identifie", label: "Projet identifié" },
  { id: "recherche_active", label: "En recherche active" },
  { id: "interesse", label: "Intéressé" },
  { id: "chaud", label: "Chaud" },
  { id: "client", label: "Client / converti" },
  { id: "en_pause", label: "En pause" },
  { id: "hors_cible", label: "Hors cible" },
];
export function categoryLabel(category?: string | null): string {
  return CATEGORY_OPTIONS.find((o) => o.id === category)?.label || "Nouveau";
}

/** Étiquettes "extra" (badges manuels, hors funnel CRM). */
export const EXTRA_LABEL_NAMES = ["LinkedIn", "Gagné", "Vendu", "Appelé"] as const;

/** Formatte un coût en euros (ex. 0.042 → "0,042 €"). */
export function formatCost(value?: number | null): string {
  if (value == null) return "—";
  return `${value.toFixed(value < 1 ? 3 : 2).replace(".", ",")} €`;
}

/** Remplace {prenom}/{name} par le prénom du contact (même règle que le backend). */
export function applyRelaunchTemplate(text: string, contactName?: string | null): string {
  const first = String(contactName || "").trim().split(/\s+/)[0] || "";
  return text
    .replace(/\{prenom\}/gi, first || "toi")
    .replace(/\{name\}/gi, first || "toi")
    .trim();
}

/** Découpe un texte en segments { text, url? } pour rendre les liens cliquables. */
const URL_RE = /(https?:\/\/[^\s]+)/gi;
export function linkifySegments(text: string): { text: string; url?: string }[] {
  if (!text) return [{ text: "" }];
  const parts: { text: string; url?: string }[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  URL_RE.lastIndex = 0;
  while ((match = URL_RE.exec(text))) {
    if (match.index > lastIndex) parts.push({ text: text.slice(lastIndex, match.index) });
    let url = match[0];
    // Ne pas inclure la ponctuation finale dans le lien.
    const trailing = url.match(/[.,;:!?)\]]+$/);
    if (trailing) url = url.slice(0, -trailing[0].length);
    parts.push({ text: url, url });
    if (trailing) parts.push({ text: trailing[0] });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ text: text.slice(lastIndex) });
  return parts.length ? parts : [{ text }];
}

/** Format court d'une date ISO pour un RDV Cal.com (ex. "lun. 12 août à 14:30"). */
export function formatCalRdv(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const day = d.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "long" }).replace(".", "");
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${day} à ${time}`;
}

/** Regroupe les messages consécutifs par jour pour insérer des séparateurs. */
export function shouldShowDaySeparator(
  current: { date?: string },
  previous: { date?: string } | undefined,
): boolean {
  if (!previous) return true;
  const a = parseServerDate(current.date);
  const b = parseServerDate(previous.date);
  if (!a || !b) return false;
  return a.toDateString() !== b.toDateString();
}
