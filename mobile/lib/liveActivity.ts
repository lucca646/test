import { Platform } from "react-native";
import { beatsForMode } from "./islandCopy";
import type { IslandMode } from "./islandTypes";

export type { IslandMode };
export type LiveActivityState = {
  title: string;
  subtitle?: string;
  progressBar?: { date: number } | { progress: number };
  imageName?: string;
  dynamicIslandImageName?: string;
};

export type LiveActivityConfig = {
  backgroundColor?: string;
  titleColor?: string;
  subtitleColor?: string;
  progressViewTint?: string;
  progressViewLabelColor?: string;
  deepLinkUrl?: string;
  timerType?: "circular" | "digital";
  padding?: { horizontal?: number; top?: number; bottom?: number };
  imagePosition?: "left" | "right";
  imageAlign?: "center" | "top" | "bottom";
};

export type LiveActivityBridge = {
  available: boolean;
  reason?: string;
  startActivity?: (
    state: LiveActivityState,
    config?: LiveActivityConfig,
  ) => string | undefined | void;
  updateActivity?: (id: string, state: LiveActivityState) => void;
  stopActivity?: (id: string, state: LiveActivityState) => void;
};

export function getLiveActivityBridge(): LiveActivityBridge {
  if (Platform.OS !== "ios") {
    return { available: false, reason: "Live Activities = iOS uniquement." };
  }
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const LiveActivity = require("expo-live-activity") as {
      startActivity: LiveActivityBridge["startActivity"];
      updateActivity: LiveActivityBridge["updateActivity"];
      stopActivity: LiveActivityBridge["stopActivity"];
    };
    if (typeof LiveActivity.startActivity !== "function") {
      return {
        available: false,
        reason: "Module présent mais API incomplete.",
      };
    }
    return {
      available: true,
      startActivity: LiveActivity.startActivity,
      updateActivity: LiveActivity.updateActivity,
      stopActivity: LiveActivity.stopActivity,
    };
  } catch {
    return {
      available: false,
      reason:
        "Native module absent. Utilise un Dev Client (eas build), pas Expo Go.",
    };
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export async function killActivities(
  bridge: LiveActivityBridge,
  ids: Iterable<string>,
): Promise<void> {
  if (!bridge.stopActivity) return;
  const list = [...new Set(ids)].filter(Boolean);
  for (const id of list) {
    try {
      bridge.stopActivity(id, { title: "Fin", subtitle: "Remplacement" });
    } catch {
      /* déjà morte */
    }
  }
  if (list.length > 0) await sleep(450);
}

type ThemeCfg = Pick<
  LiveActivityConfig,
  "backgroundColor" | "timerType" | "deepLinkUrl"
>;

const THEMES: Record<IslandMode, ThemeCfg> = {
  timer: {
    backgroundColor: "#0B0B0F",
    timerType: "digital",
    deepLinkUrl: "/",
  },
  music: {
    backgroundColor: "#12081C",
    timerType: "digital",
    deepLinkUrl: "/",
  },
  progress: {
    backgroundColor: "#071018",
    timerType: "circular",
    deepLinkUrl: "/",
  },
  focus: {
    backgroundColor: "#0A1A12",
    timerType: "digital",
    deepLinkUrl: "/",
  },
  breathe: {
    backgroundColor: "#0A1420",
    timerType: "circular",
    deepLinkUrl: "/",
  },
  score: {
    backgroundColor: "#1A0A0A",
    timerType: "digital",
    deepLinkUrl: "/",
  },
};

const PAD = { horizontal: 16, top: 14, bottom: 14 };

export type ModePayload = {
  state: LiveActivityState;
  config: LiveActivityConfig;
};

export function autopilotInterval(mode: IslandMode): number {
  switch (mode) {
    case "breathe":
      return 4000;
    case "score":
      return 2500;
    case "focus":
      return 5000;
    case "music":
      return 4000;
    case "progress":
      return 3500;
    case "timer":
    default:
      return 6000;
  }
}

export function stateForMode(mode: IslandMode, tick = 0): ModePayload {
  const now = Date.now();
  const beat = beatsForMode(mode, tick);
  const theme = THEMES[mode];
  return {
    state: {
      title: beat.title,
      subtitle: beat.subtitle,
      progressBar: { date: now + beat.seconds * 1000 },
    },
    config: {
      titleColor: "#FFFFFF",
      subtitleColor: "#FFFFFFCC",
      progressViewLabelColor: "#FFFFFF",
      progressViewTint: beat.tint ?? "#0A84FF",
      padding: PAD,
      ...theme,
    },
  };
}
