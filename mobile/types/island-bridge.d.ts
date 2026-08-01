declare module "island-bridge/client" {
  export function createIslandBridgeClient(opts: {
    url: string;
    platform?: string;
    role?: string;
    onCommand?: (cmd: {
      op: string;
      mode?: string;
      delta?: number;
      message?: string;
      ms?: number;
    }) => void;
    onStatus?: (s: string) => void;
    onPeers?: (n: number) => void;
  }): {
    runScript: (script: string) => void;
    publishCommand: (command: object) => void;
    close: () => void;
    send: (payload: object) => void;
  };

  export function defaultBridgeWsUrl(httpBase?: string): string;
}

declare module "island-bridge" {
  export * from "island-bridge/client";
}
