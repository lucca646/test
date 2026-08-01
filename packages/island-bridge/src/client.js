/**
 * Client WebSocket universel (navigateur + React Native).
 *
 * @param {{
 *   url: string,
 *   platform?: string,
 *   role?: string,
 *   onCommand?: (cmd: object) => void,
 *   onStatus?: (s: string) => void,
 *   onPeers?: (n: number) => void,
 * }} opts
 */
export function createIslandBridgeClient(opts) {
  const {
    url,
    platform = "unknown",
    role = "peer",
    onCommand,
    onStatus,
    onPeers,
  } = opts;

  let ws = null;
  let closed = false;
  let retry = 0;
  let timer = null;

  const status = (s) => onStatus?.(s);

  function connect() {
    if (closed) return;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      status(`WS erreur: ${e.message}`);
      scheduleReconnect();
      return;
    }

    ws.onopen = () => {
      retry = 0;
      status(`Connecté · ${platform}`);
      send({
        type: "hello",
        platform,
        role,
        at: Date.now(),
      });
    };

    ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(String(ev.data));
      } catch {
        return;
      }
      if (msg.type === "command" && msg.command) {
        onCommand?.(msg.command);
      } else if (msg.type === "peers") {
        onPeers?.(msg.count ?? 0);
      } else if (msg.type === "status") {
        status(msg.message ?? "status");
      } else if (msg.type === "error") {
        status(msg.message ?? "erreur bridge");
      }
    };

    ws.onclose = () => {
      ws = null;
      if (!closed) {
        status("Déconnecté — reconnexion…");
        scheduleReconnect();
      }
    };

    ws.onerror = () => {
      status("Erreur WebSocket");
    };
  }

  function scheduleReconnect() {
    if (closed || timer) return;
    const delay = Math.min(8000, 600 + retry * 700);
    retry += 1;
    timer = setTimeout(() => {
      timer = null;
      connect();
    }, delay);
  }

  function send(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }

  /** Demande au serveur d’interpréter + broadcaster un script. */
  function runScript(script) {
    send({ type: "run", script: String(script ?? "") });
  }

  /** Diffuse une commande déjà formée (contrôleur). */
  function publishCommand(command) {
    send({ type: "publish", command });
  }

  function close() {
    closed = true;
    if (timer) clearTimeout(timer);
    timer = null;
    try {
      ws?.close();
    } catch {
      /* ignore */
    }
    ws = null;
  }

  connect();

  return { runScript, publishCommand, close, send };
}

/** URL WS par défaut (dev local). */
export function defaultBridgeWsUrl(httpBase) {
  if (httpBase) {
    return httpBase.replace(/^http/, "ws").replace(/\/$/, "") + "/ws";
  }
  if (typeof location !== "undefined" && location?.protocol) {
    const proto = location.protocol === "https:" ? "wss:" : "ws:";
    return `${proto}//${location.hostname}:8792/ws`;
  }
  return "ws://127.0.0.1:8792/ws";
}
