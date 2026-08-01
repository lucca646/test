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
};

export type ModePayload = {
  state: LiveActivityState;
  config: LiveActivityConfig;
};

/**
 * Pas d’imageName : les PNG Live Activity du binaire actuel sont corrompus
 * (carré violet). Sans rebuild on omet les images.
 * Timer utilise une date (compact trailing digital) — requis par le widget.
 */
export function stateForMode(mode: IslandMode, tick = 0): ModePayload {
  const now = Date.now();
  switch (mode) {
    case "progress": {
      // Le widget DI n’affiche une barre en compact/bottom QUE si `date` est set.
      // On combine date (countdown) + titre livraison pour un rendu île correct.
      const mins = Math.max(1, 12 - (tick % 5));
      return {
        state: {
          title: ["Livraison en cours", "Colis en route", "Presque là"][
            tick % 3
          ],
          subtitle: `Arrivée estimée · ${mins} min`,
          progressBar: { date: now + mins * 60_000 },
        },
        config: { ...BASE_CONFIG, timerType: "circular" },
      };
    }
    case "music":
      return {
        state: {
          title: ["Liquid Glass", "COR·ALT Live", "Island Drop"][tick % 3],
          subtitle: "Now Playing · COR·ALT",
          // date pour avoir un trailing compact ; digital lisible
          progressBar: { date: now + Math.max(90_000, (4 - (tick % 4)) * 45_000) },
        },
        config: { ...BASE_CONFIG, timerType: "digital", deepLinkUrl: "/arcade" },
      };
    case "timer":
    default:
      return {
        state: {
          title: ["Timer Liquid Glass", "Focus 25′", "Sprint final"][tick % 3],
          subtitle: "Compte à rebours",
          progressBar: {
            date: now + Math.max(60_000, (5 - (tick % 5)) * 60_000),
          },
        },
        config: { ...BASE_CONFIG, timerType: "digital" },
      };
  }
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * stopActivity natif est async (Task {}) : un start immédiat laisse l’ancienne
 * activité zombie sur l’île. On stoppe tous les IDs connus puis on attend.
 */
export async function killActivities(
  bridge: LiveActivityBridge,
  ids: Iterable<string>,
): Promise<void> {
  if (!bridge.stopActivity) return;
  const list = [...new Set(ids)].filter(Boolean);
  for (const id of list) {
    try {
      bridge.stopActivity(id, {
        title: "Fin",
        subtitle: "Remplacement",
      });
    } catch {
      /* déjà morte */
    }
  }
  if (list.length > 0) await sleep(450);
}
