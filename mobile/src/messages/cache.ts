import type { ConversationDetail, ConversationSummary, StatsPayload } from "./api";

/**
 * Cache mémoire (session app) — stale-while-revalidate.
 * Objectif : ne jamais remplacer un écran déjà rempli par un spinner plein
 * écran lors d'un simple retour de focus ; on affiche les données en cache
 * immédiatement puis on rafraîchit en tâche de fond (silencieux).
 */

export const conversationsCache = new Map<string, ConversationSummary[]>();
export const threadCache = new Map<string, ConversationDetail>();
export const statsCache = new Map<string, StatsPayload>();

export function conversationsCacheKey(simFilter: string): string {
  return simFilter || "all";
}

export function statsCacheKey(sim: string, from: string, to: string): string {
  return `${sim}:${from}:${to}`;
}
