import { useEffect, useRef, useState } from "react";
import {
  createIslandBridgeClient,
  defaultBridgeWsUrl,
} from "island-bridge/client";

/**
 * Connecte la PWA au bridge interprète (même bus que l’iPhone).
 */
export function useIslandBridge({ enabled = true, onCommand } = {}) {
  const [status, setStatus] = useState(
    enabled ? "Bridge · connexion…" : "Bridge off",
  );
  const [peers, setPeers] = useState(0);
  const clientRef = useRef(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  useEffect(() => {
    if (!enabled) return undefined;

    const envUrl =
      typeof import.meta !== "undefined" && import.meta.env?.VITE_ISLAND_BRIDGE_WS;
    const url = envUrl || defaultBridgeWsUrl();

    const client = createIslandBridgeClient({
      url,
      platform: "web",
      role: "peer",
      onCommand: (cmd) => onCommandRef.current?.(cmd),
      onStatus: setStatus,
      onPeers: setPeers,
    });
    clientRef.current = client;

    return () => {
      client.close();
      clientRef.current = null;
    };
  }, [enabled]);

  return {
    status,
    peers,
    runScript: (script) => clientRef.current?.runScript(script),
    publishCommand: (command) => clientRef.current?.publishCommand(command),
  };
}
