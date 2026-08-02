#!/usr/bin/env node
/**
 * Island Bridge — interprète un script unique et le diffuse
 * aux clients web + iOS (WebSocket).
 *
 *   node packages/island-bridge/server.mjs
 *   PORT=8792 node ...
 *
 * HTTP:
 *   GET  /bridge/health
 *   POST /bridge/run     { "script": "mode score\\nstart" }
 *   GET  /bridge/example
 *
 * WS: /ws
 */
import http from "node:http";
import { WebSocketServer } from "ws";
import { interpret, runCommands } from "./src/interpret.js";
import {
  PROTOCOL_VERSION,
  MIN_PROTOCOL_VERSION,
  ISLAND_MODES,
  PEER_OPS,
  normalizeCommand,
  buildWelcome,
  assertCompatible,
} from "./src/protocol.js";

const PORT = Number(process.env.ISLAND_BRIDGE_PORT || process.env.PORT || 8792);

/** @type {Set<import('ws').WebSocket>} */
const peers = new Set();

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
}

function json(res, code, body) {
  cors(res);
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

function broadcast(msg, except = null) {
  const data = JSON.stringify(msg);
  for (const ws of peers) {
    if (ws !== except && ws.readyState === 1) ws.send(data);
  }
}

function peersCount() {
  broadcast({ type: "peers", count: peers.size });
}

async function executeScript(script, origin = "http") {
  const { commands, errors } = interpret(script);
  if (errors.length) {
    return { ok: false, errors, commands: [] };
  }

  // wait côté serveur avant chaque commande non-wait, pour sync multi-clients
  const delivered = [];
  await runCommands(commands, async (cmd) => {
    broadcast({ type: "command", command: cmd, origin });
    delivered.push(cmd);
  });

  return { ok: true, errors: [], commands: delivered };
}

const EXAMPLE = `# Script unique → web + iOS
mode score
start
wait 1200
phase
wait 800
mode progress
update
wait 1000
mode music
update
wait 800
stop
`;

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "OPTIONS") {
    cors(res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === "GET" && url.pathname === "/bridge/health") {
    json(res, 200, {
      ok: true,
      bridge: "island",
      peers: peers.size,
      port: PORT,
      protocolVersion: PROTOCOL_VERSION,
      minProtocolVersion: MIN_PROTOCOL_VERSION,
      modes: ISLAND_MODES,
      ops: PEER_OPS,
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/bridge/example") {
    json(res, 200, { script: EXAMPLE });
    return;
  }

  if (req.method === "POST" && url.pathname === "/bridge/run") {
    try {
      const body = await readBody(req);
      const result = await executeScript(String(body.script ?? ""), "http");
      json(res, result.ok ? 200 : 400, result);
    } catch (e) {
      json(res, 400, { ok: false, errors: [e.message], commands: [] });
    }
    return;
  }

  if (req.method === "GET" && (url.pathname === "/" || url.pathname === "/bridge")) {
    json(res, 200, {
      name: "island-bridge",
      health: "/bridge/health",
      run: "POST /bridge/run",
      ws: `ws://0.0.0.0:${PORT}/ws`,
    });
    return;
  }

  json(res, 404, { ok: false, error: "not found" });
});

const wss = new WebSocketServer({ server, path: "/ws" });

wss.on("connection", (ws) => {
  peers.add(ws);
  peersCount();
  ws.send(
    JSON.stringify({
      type: "status",
      message: `Hello · ${peers.size} peer(s) sur le bridge`,
    }),
  );

  ws.on("message", async (raw) => {
    let msg;
    try {
      msg = JSON.parse(String(raw));
    } catch {
      ws.send(JSON.stringify({ type: "error", message: "JSON invalide" }));
      return;
    }

    if (msg.type === "hello") {
      ws.meta = {
        platform: msg.platform || "?",
        role: msg.role || "peer",
        protocolVersion: msg.protocolVersion,
        capabilities: msg.capabilities,
        at: msg.at,
      };

      const compat = assertCompatible(msg.protocolVersion);
      if (!compat.ok) {
        console.warn(
          `[island-bridge] peer incompatible (${ws.meta.platform}): ${compat.message}`,
        );
        ws.send(
          JSON.stringify({
            type: "unsupported",
            message: compat.message,
            protocolVersion: PROTOCOL_VERSION,
            minProtocolVersion: MIN_PROTOCOL_VERSION,
          }),
        );
      }

      ws.send(JSON.stringify(buildWelcome({ peers: peers.size })));
      ws.send(
        JSON.stringify({
          type: "status",
          message: `Peer ${ws.meta.platform} · rôle ${ws.meta.role}`,
        }),
      );
      return;
    }

    if (msg.type === "run") {
      const result = await executeScript(String(msg.script ?? ""), "ws");
      ws.send(
        JSON.stringify({
          type: result.ok ? "status" : "error",
          message: result.ok
            ? `Script OK · ${result.commands.length} cmd`
            : result.errors.join(" · "),
          result,
        }),
      );
      return;
    }

    if (msg.type === "publish" && msg.command) {
      const normalized = normalizeCommand(msg.command);
      if (normalized.error) {
        ws.send(
          JSON.stringify({
            type: "error",
            message: normalized.error,
          }),
        );
        return;
      }
      broadcast(
        { type: "command", command: normalized.value, origin: "peer" },
        ws,
      );
      // aussi s’appliquer côté émetteur si demandé
      if (msg.echoSelf) {
        ws.send(
          JSON.stringify({ type: "command", command: normalized.value }),
        );
      }
      return;
    }
  });

  ws.on("close", () => {
    peers.delete(ws);
    peersCount();
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`[island-bridge] http://0.0.0.0:${PORT}`);
  console.log(`[island-bridge] ws://0.0.0.0:${PORT}/ws`);
  console.log(`[island-bridge] POST /bridge/run  { "script": "mode score\\nstart" }`);
  console.log(
    `[island-bridge] protocol v${PROTOCOL_VERSION} (min v${MIN_PROTOCOL_VERSION})`,
  );
});
