/** Initiales pour l'avatar (façon Apple Messages), ex. "Jean Dupont" → "JD". */
export function initials(name: string): string {
  const trimmed = String(name || "").trim();
  if (!trimmed) return "?";
  if (/^\+?\d[\d\s]*$/.test(trimmed)) return trimmed.replace(/\D/g, "").slice(-2) || "?";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Couleur d'avatar stable par numéro/nom (palette iOS Messages). */
const AVATAR_PALETTE = [
  "#8e8e93",
  "#ff9f0a",
  "#ff375f",
  "#af52de",
  "#5e5ce6",
  "#0a84ff",
  "#64d2ff",
  "#30d158",
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

/** Libellé de séparateur de jour dans le fil (façon iMessage). */
export function formatDaySeparator(raw?: string | null): string {
  const d = parseServerDate(raw);
  if (!d) return "";
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay) {
    return `Aujourd’hui ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  if (d.toDateString() === yesterday.toDateString()) {
    return `Hier ${d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}`;
  }
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
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
