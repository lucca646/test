import { ISLAND_MODES, isIslandMode } from "./protocol.js";

/**
 * Interprète un mini-script JS/DSL → commandes bridge.
 *
 * Exemple :
 * ```
 * mode score
 * start
 * wait 800
 * phase
 * mode progress
 * update
 * stop
 * ```
 *
 * Ou JSON lines :
 * `{"op":"mode","mode":"music"}`
 *
 * @param {string} source
 * @returns {{ commands: import('./protocol.js').BridgeCommand[], errors: string[] }}
 */
export function interpret(source) {
  const commands = [];
  const errors = [];
  if (typeof source !== "string" || !source.trim()) {
    return { commands, errors: ["Script vide."] };
  }

  const lines = source.replace(/\r\n/g, "\n").split("\n");

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    let raw = lines[i].trim();
    if (!raw || raw.startsWith("#") || raw.startsWith("//")) continue;

    // JSON line
    if (raw.startsWith("{")) {
      try {
        const obj = JSON.parse(raw);
        const cmd = normalizeCommand(obj, lineNo);
        if (cmd.error) errors.push(`L${lineNo}: ${cmd.error}`);
        else commands.push(cmd.value);
      } catch (e) {
        errors.push(`L${lineNo}: JSON invalide (${e.message})`);
      }
      continue;
    }

    // DSL: op args...
    const parts = raw.split(/\s+/);
    const head = parts[0].toLowerCase();
    const arg = parts.slice(1).join(" ").trim();

    switch (head) {
      case "mode":
      case "setmode": {
        const mode = arg.toLowerCase();
        if (!isIslandMode(mode)) {
          errors.push(
            `L${lineNo}: mode inconnu « ${arg} » (attendu: ${ISLAND_MODES.join(", ")})`,
          );
          break;
        }
        commands.push({ op: "mode", mode, line: lineNo });
        break;
      }
      case "start":
        commands.push({ op: "start", line: lineNo });
        break;
      case "update":
        commands.push({ op: "update", line: lineNo });
        break;
      case "phase":
      case "phase+":
      case "next":
        commands.push({
          op: "phase",
          delta: Number.parseInt(arg || "1", 10) || 1,
          line: lineNo,
        });
        break;
      case "stop":
      case "kill":
        commands.push({ op: "stop", line: lineNo });
        break;
      case "wait":
      case "sleep": {
        const ms = Number.parseInt(arg || "500", 10);
        if (!Number.isFinite(ms) || ms < 0) {
          errors.push(`L${lineNo}: wait attend des ms`);
          break;
        }
        commands.push({ op: "wait", ms: Math.min(ms, 30_000), line: lineNo });
        break;
      }
      case "echo":
      case "log":
        commands.push({ op: "echo", message: arg || "", line: lineNo });
        break;
      case "nop":
        commands.push({ op: "nop", line: lineNo });
        break;
      default:
        errors.push(`L${lineNo}: commande inconnue « ${head} »`);
    }
  }

  return { commands, errors };
}

function normalizeCommand(obj, lineNo) {
  if (!obj || typeof obj !== "object" || typeof obj.op !== "string") {
    return { error: "objet commande invalide (op requis)" };
  }
  const op = obj.op.toLowerCase();
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
 * Exécute les waits localement puis appelle `dispatch` pour le reste.
 * @param {import('./protocol.js').BridgeCommand[]} commands
 * @param {(cmd: import('./protocol.js').BridgeCommand) => void | Promise<void>} dispatch
 */
export async function runCommands(commands, dispatch) {
  for (const cmd of commands) {
    if (cmd.op === "wait") {
      await sleep(cmd.ms ?? 0);
      continue;
    }
    if (cmd.op === "nop") continue;
    await dispatch(cmd);
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
