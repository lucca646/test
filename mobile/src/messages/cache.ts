import type { ConversationDetail, ConversationSummary, StatsPayload } from "./api";

/**
 * Cache mémoire (session app) — stale-while-revalidate.
 * Objectif : ne jamais remplacer un écran déjà rempli par un spinner plein
 * écran lors d'un simple retour de focus ; on affiche les données en cache
 * immédiatement puis on rafraîchit en tâche de fond (silencieux).
 */

/**
 * Une seule entrée pour la liste des conversations : on récupère toujours
 * *toutes* les conversations (tous SIM confondus) en un seul appel réseau,
 * et le filtre SIM se fait ensuite côté client (par `sim_id`). Ça évite un
 * rechargement réseau à chaque changement d'onglet SIM et garde les données
 * disponibles même hors connexion (dernier snapshot connu, jamais vidé).
 */
export const CONVERSATIONS_CACHE_KEY = "all-sims";
export const conversationsCache = new Map<string, ConversationSummary[]>();
export const threadCache = new Map<string, ConversationDetail>();
export const statsCache = new Map<string, StatsPayload>();

export function statsCacheKey(sim: string, from: string, to: string): string {
  return `${sim}:${from}:${to}`;
}
