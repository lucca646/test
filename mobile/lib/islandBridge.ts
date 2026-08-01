import Constants from "expo-constants";
import { createIslandBridgeClient } from "island-bridge/client";
import type { IslandMode } from "./islandTypes";

export type BridgeCommand = {
  op: string;
  mode?: string;
  delta?: number;
  message?: string;
  ms?: number;
};

const MODES: IslandMode[] = [
  "timer",
  "music",
  "progress",
  "focus",
  "breathe",
  "score",
];

export function isBridgeMode(value: unknown): value is IslandMode {
  return typeof value === "string" && (MODES as string[]).includes(value);
}

/** URL WS : EXPO_PUBLIC_ISLAND_BRIDGE_URL ou extra.islandBridgeWs */
export function resolveIslandBridgeUrl(): string | null {
  const env = process.env.EXPO_PUBLIC_ISLAND_BRIDGE_URL?.trim();
  if (env) return env;
  const extra = Constants.expoConfig?.extra as
    | { islandBridgeWs?: string }
    | undefined;
  return extra?.islandBridgeWs?.trim() || null;
}

export function connectIslandBridge(opts: {
  onCommand: (cmd: BridgeCommand) => void;
  onStatus?: (s: string) => void;
  onPeers?: (n: number) => void;
}) {
  const url = resolveIslandBridgeUrl();
  if (!url) {
    opts.onStatus?.(
      "Bridge off — définis EXPO_PUBLIC_ISLAND_BRIDGE_URL=ws://…:8792/ws",
    );
    return null;
  }

  return createIslandBridgeClient({
    url,
    platform: "ios",
    role: "peer",
    onCommand: opts.onCommand,
    onStatus: opts.onStatus,
    onPeers: opts.onPeers,
  });
}
