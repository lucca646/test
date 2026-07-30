import { Platform } from "react-native";

export type IslandMode =
  | "compact"
  | "minimal"
  | "expanded"
  | "timer"
  | "music"
  | "progress";

export type LiveActivityBridge = {
  available: boolean;
  reason?: string;
  startActivity?: (
    state: Record<string, unknown>,
    config?: Record<string, unknown>,
  ) => string | undefined | void;
  updateActivity?: (id: string, state: Record<string, unknown>) => void;
  stopActivity?: (id: string, state: Record<string, unknown>) => void;
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

const BASE_CONFIG = {
  backgroundColor: "#0B0B0F",
  titleColor: "#FFFFFF",
  subtitleColor: "#FFFFFF99",
  progressViewTint: "#0A84FF",
  progressViewLabelColor: "#FFFFFF",
  deepLinkUrl: "/",
  padding: { horizontal: 16, top: 14, bottom: 14 },
  imagePosition: "right" as const,
  imageAlign: "center" as const,
};

/** Mappe nos modes UI → state/config ActivityKit (via expo-live-activity). */
export function stateForMode(mode: IslandMode) {
  const now = Date.now();
  switch (mode) {
    case "timer":
      return {
        state: {
          title: "Timer Liquid Glass",
          subtitle: "Compte à rebours · Dynamic Island",
          progressBar: { date: now + 5 * 60 * 1000 },
          imageName: "live_cover",
          dynamicIslandImageName: "island_timer",
        },
        config: { ...BASE_CONFIG, timerType: "digital" as const },
      };
    case "progress":
      return {
        state: {
          title: "Livraison en cours",
          subtitle: "Arrivée estimée · 12 min",
          progressBar: { progress: 0.62 },
          imageName: "live_cover",
          dynamicIslandImageName: "island_progress",
        },
        config: { ...BASE_CONFIG, timerType: "circular" as const },
      };
    case "music":
      return {
        state: {
          title: "Liquid Glass",
          subtitle: "COR·ALT · Now Playing",
          progressBar: { progress: 0.35 },
          imageName: "live_cover",
          dynamicIslandImageName: "island_icon",
        },
        config: { ...BASE_CONFIG, deepLinkUrl: "/arcade" },
      };
    case "minimal":
      return {
        state: {
          title: "LG",
          subtitle: "Minimal",
          dynamicIslandImageName: "island_icon",
        },
        config: BASE_CONFIG,
      };
    case "expanded":
      return {
        state: {
          title: "Session active",
          subtitle: "Expanded · leading / trailing / center / bottom",
          progressBar: { progress: 0.8 },
          imageName: "live_cover",
          dynamicIslandImageName: "island_icon",
        },
        config: BASE_CONFIG,
      };
    case "compact":
    default:
      return {
        state: {
          title: "Liquid Glass",
          subtitle: "Compact · leading + trailing",
          progressBar: { date: now + 2 * 60 * 1000 },
          imageName: "live_cover",
          dynamicIslandImageName: "island_icon",
        },
        config: { ...BASE_CONFIG, timerType: "circular" as const },
      };
  }
}
