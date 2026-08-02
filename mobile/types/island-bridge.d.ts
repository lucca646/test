declare module "island-bridge/protocol" {
  export const ISLAND_MODES: readonly string[];
  export const PROTOCOL_VERSION: number;
  export const MIN_PROTOCOL_VERSION: number;
  export const BRIDGE_OPS: readonly string[];
  export const PEER_OPS: readonly string[];
  export const DEFAULT_PEER_CAPABILITIES: {
    modes: readonly string[];
    ops: readonly string[];
    features: readonly string[];
  };
  export function isIslandMode(value: unknown): boolean;
  export function isBridgeOp(value: unknown): boolean;
  export function normalizeCommand(
    obj: object,
    lineNo?: number,
  ): { value: object } | { error: string };
  export function buildWelcome(opts: { peers: number }): object;
  export function assertCompatible(clientVersion: number): {
    ok: boolean;
    message: string;
  };
}

declare module "island-bridge/client" {
  export function createIslandBridgeClient(opts: {
    url: string;
    platform?: string;
    role?: string;
    capabilities?: object;
    onCommand?: (cmd: {
      op: string;
      mode?: string;
      delta?: number;
      message?: string;
      ms?: number;
    }) => void;
    onStatus?: (s: string) => void;
    onPeers?: (n: number) => void;
    onWelcome?: (msg: {
      protocolVersion?: number;
      modes?: string[];
      ops?: string[];
      peers?: number;
    }) => void;
  }): {
    runScript: (script: string) => void;
    publishCommand: (command: object) => void;
    close: () => void;
    send: (payload: object) => void;
    getWelcome: () => object | null;
  };

  export function defaultBridgeWsUrl(httpBase?: string): string;
}

declare module "island-bridge" {
  export * from "island-bridge/client";
  export * from "island-bridge/protocol";
  export function interpret(source: string): {
    commands: object[];
    errors: string[];
  };
  export function runCommands(
    commands: object[],
    dispatch: (cmd: object) => void | Promise<void>,
  ): Promise<void>;
}
