/** Modes alignés mobile/lib/islandTypes + web. */
export const ISLAND_MODES = [
  "timer",
  "music",
  "progress",
  "focus",
  "breathe",
  "score",
];

/**
 * @typedef {'mode'|'start'|'update'|'phase'|'stop'|'echo'|'wait'|'nop'} BridgeOp
 * @typedef {{
 *   op: BridgeOp,
 *   mode?: string,
 *   delta?: number,
 *   ms?: number,
 *   message?: string,
 *   line?: number,
 * }} BridgeCommand
 */

export function isIslandMode(value) {
  return ISLAND_MODES.includes(value);
}
