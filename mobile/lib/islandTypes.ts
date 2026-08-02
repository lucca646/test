import { ISLAND_MODES } from "island-bridge/protocol";

/** Types île — dérivés du protocole central (pas de liste locale). */
export type IslandMode = (typeof ISLAND_MODES)[number];

export const ISLAND_MODE_LIST = ISLAND_MODES as readonly IslandMode[];
