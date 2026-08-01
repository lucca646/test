import { Platform } from "react-native";

/** Modes contenu Live Activity (ce qui est vraiment poussé sur l’île). */
export type IslandMode = "timer" | "music" | "progress";

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

/** Charge le module natif seulement s’il existe (dev build). Expo Go → unavailable. */
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

const BASE_CONFIG: LiveActivityConfig = {
  backgroundColor: "#0B0B0F",
  titleColor: "#FFFFFF",
  subtitleColor: "#FFFFFF99",
  progressViewTint: "#0A84FF",
  progressViewLabelColor: "#FFFFFF",
  deepLinkUrl: "/",
  padding: { horizontal: 16, top: 14, bottom: 14 },
  imagePosition: "right",
  imageAlign: "center",
};

export type ModePayload = {
  state: LiveActivityState;
  config: LiveActivityConfig;
};

/** Mappe nos modes UI → state/config ActivityKit (via expo-live-activity). */
export function stateForMode(mode: IslandMode, tick = 0): ModePayload {
  const now = Date.now();
  switch (mode) {
    case "progress":
      return {
        state: {
          title: ["Livraison en cours", "Colis en route", "Presque là"][
            tick % 3
          ],
          subtitle: `Arrivée estimée · ${12 - (tick % 5)} min`,
          progressBar: { progress: Math.min(0.95, 0.35 + tick * 0.12) },
          imageName: "live_cover",
          dynamicIslandImageName: "island_progress",
        },
        config: { ...BASE_CONFIG, timerType: "circular" },
      };
    case "music":
      return {
        state: {
          title: ["Liquid Glass", "COR·ALT Live", "Island Drop"][tick % 3],
          subtitle: "COR·ALT · Now Playing",
          progressBar: { progress: Math.min(0.95, 0.22 + tick * 0.15) },
          imageName: "live_cover",
          dynamicIslandImageName: "island_icon",
        },
        config: { ...BASE_CONFIG, deepLinkUrl: "/arcade" },
      };
    case "timer":
    default:
      return {
        state: {
          title: ["Timer Liquid Glass", "Focus 25′", "Sprint final"][tick % 3],
          subtitle: "Compte à rebours · Dynamic Island",
          progressBar: { date: now + Math.max(60_000, (5 - (tick % 5)) * 60_000) },
          imageName: "live_cover",
          dynamicIslandImageName: "island_timer",
        },
        config: { ...BASE_CONFIG, timerType: "digital" },
      };
  }
}

/**
 * ActivityKit ne permet pas de changer `config` via update.
 * Si timerType diffère (digital / circulaire / absent) ⇒ stop + start.
 */
export function needsRestart(from: IslandMode, to: IslandMode): boolean {
  if (from === to) return false;
  const a = stateForMode(from).config.timerType ?? "none";
  const b = stateForMode(to).config.timerType ?? "none";
  return a !== b;
}
