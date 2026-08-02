/** Modes alignés mobile/lib/islandTypes + web. */
export const ISLAND_MODES = [
  "timer",
  "music",
  "progress",
  "focus",
  "breathe",
  "score",
];

export const PROTOCOL_VERSION = 1;
export const MIN_PROTOCOL_VERSION = 1;

/** Ops acceptées côté bridge (script + publish). */
export const BRIDGE_OPS = [
  "mode",
  "start",
  "update",
  "phase",
  "stop",
  "echo",
  "wait",
  "nop",
];

/** Ops que les peers doivent exécuter (hors contrôle local wait/nop). */
export const PEER_OPS = ["mode", "start", "update", "phase", "stop", "echo"];

export const DEFAULT_PEER_CAPABILITIES = {
  modes: ISLAND_MODES,
  ops: PEER_OPS,
  features: ["phase.delta"],
};

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

export function isBridgeOp(value) {
  return typeof value === "string" && BRIDGE_OPS.includes(value.toLowerCase());
}

/**
 * Normalise un objet commande JSON → { value } | { error }.
 * @param {object} obj
 * @param {number} [lineNo]
 * @returns {{ value: import('./protocol.js').BridgeCommand } | { error: string }}
 */
export function normalizeCommand(obj, lineNo) {
  if (!obj || typeof obj !== "object" || typeof obj.op !== "string") {
    return { error: "objet commande invalide (op requis)" };
  }
  const op = obj.op.toLowerCase();
  if (!isBridgeOp(op)) {
    return { error: `op inconnue « ${obj.op} »` };
  }
  if (op === "mode") {
    if (!isIslandMode(obj.mode)) {
      return { error: `mode invalide « ${obj.mode} »` };
    }
    return { value: { op: "mode", mode: obj.mode, line: lineNo } };
  }
  if (op === "start" || op === "update" || op === "stop" || op === "nop") {
    return { value: { op, line: lineNo } };
  }
  if (op === "phase") {
    return {
      value: {
        op: "phase",
        delta: Number(obj.delta) || 1,
        line: lineNo,
      },
    };
  }
  if (op === "wait") {
    return {
      value: {
        op: "wait",
        ms: Math.min(Math.max(0, Number(obj.ms) || 0), 30_000),
        line: lineNo,
      },
    };
  }
  if (op === "echo") {
    return {
      value: { op: "echo", message: String(obj.message ?? ""), line: lineNo },
    };
  }
  return { error: `op inconnue « ${obj.op} »` };
}

/**
 * Message welcome envoyé après hello.
 * @param {{ peers: number }} opts
 */
export function buildWelcome({ peers }) {
  return {
    type: "welcome",
    protocolVersion: PROTOCOL_VERSION,
    minProtocolVersion: MIN_PROTOCOL_VERSION,
    modes: ISLAND_MODES,
    ops: PEER_OPS,
    peers,
  };
}

/**
 * Vérifie qu'une version client est compatible avec ce bridge.
 * @param {number} clientVersion
 * @returns {{ ok: boolean, message: string }}
 */
export function assertCompatible(clientVersion) {
  if (typeof clientVersion !== "number" || !Number.isFinite(clientVersion)) {
    return {
      ok: false,
      message: "protocolVersion client manquante ou invalide",
    };
  }
  if (clientVersion < MIN_PROTOCOL_VERSION) {
    return {
      ok: false,
      message: `client v${clientVersion} < min v${MIN_PROTOCOL_VERSION}`,
    };
  }
  if (clientVersion > PROTOCOL_VERSION) {
    return {
      ok: false,
      message: `client v${clientVersion} > bridge v${PROTOCOL_VERSION}`,
    };
  }
  return { ok: true, message: "compatible" };
}
