import { Platform } from "react-native";

/** Modes contenu Live Activity (poussés sur l’île). */
export type IslandMode =
  | "timer"
  | "music"
  | "progress"
  | "focus"
  | "breathe"
  | "score";

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
  | "backgroundColor"
  | "titleColor"
  | "subtitleColor"
  | "progressViewTint"
  | "progressViewLabelColor"
  | "timerType"
  | "deepLinkUrl"
>;

const THEMES: Record<IslandMode, ThemeCfg> = {
  timer: {
    backgroundColor: "#0B0B0F",
    progressViewTint: "#0A84FF",
    timerType: "digital",
    deepLinkUrl: "/",
  },
  music: {
    backgroundColor: "#12081C",
    progressViewTint: "#BF5AF2",
    timerType: "digital",
    deepLinkUrl: "/arcade",
  },
  progress: {
    backgroundColor: "#071018",
    progressViewTint: "#64D2FF",
    timerType: "circular",
    deepLinkUrl: "/apps",
  },
  focus: {
    backgroundColor: "#0A1A12",
    progressViewTint: "#30D158",
    timerType: "digital",
    deepLinkUrl: "/",
  },
  breathe: {
    backgroundColor: "#0A1420",
    progressViewTint: "#5E5CE6",
    timerType: "circular",
    deepLinkUrl: "/games",
  },
  score: {
    backgroundColor: "#1A0A0A",
    progressViewTint: "#FF453A",
    timerType: "digital",
    deepLinkUrl: "/games",
  },
};

const PAD = { horizontal: 16, top: 14, bottom: 14 };

export type ModePayload = {
  state: LiveActivityState;
  config: LiveActivityConfig;
};

/** Intervalle autopilot recommandé par mode (ms). */
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

/**
 * Contenu île pour un mode + tick d’autopilot.
 * Pas d’images (PNG widget du binaire = carré violet).
 * Toujours une `date` → compact trailing / bottom widget fonctionnels.
 */
export function stateForMode(mode: IslandMode, tick = 0): ModePayload {
  const now = Date.now();
  const theme = THEMES[mode];
  const config: LiveActivityConfig = {
    titleColor: "#FFFFFF",
    subtitleColor: "#FFFFFF99",
    progressViewLabelColor: "#FFFFFF",
    padding: PAD,
    ...theme,
  };

  switch (mode) {
    case "progress": {
      const stages = [
        { title: "Colis scanné", sub: "Entrepôt · préparation", mins: 18 },
        { title: "En route", sub: "Livreur assigné", mins: 12 },
        { title: "Dernier km", sub: "Arrive bientôt", mins: 4 },
        { title: "À votre porte", sub: "Sonnez · code 4821", mins: 1 },
      ];
      const s = stages[tick % stages.length];
      return {
        state: {
          title: s.title,
          subtitle: `${s.sub} · ${s.mins} min`,
          progressBar: { date: now + s.mins * 60_000 },
        },
        config,
      };
    }
    case "music": {
      const tracks = [
        { title: "Liquid Glass", sub: "COR·ALT · Live Set" },
        { title: "Island Drop", sub: "feat. NativeTabs" },
        { title: "Morph Blue", sub: "B-side · 128 BPM" },
        { title: "Soft Strong", sub: "Lens Remix" },
      ];
      const t = tracks[tick % tracks.length];
      const left = Math.max(45, 210 - (tick % 8) * 22);
      return {
        state: {
          title: t.title,
          subtitle: `${t.sub} · −${fmtMmSs(left)}`,
          progressBar: { date: now + left * 1000 },
        },
        config,
      };
    }
    case "focus": {
      // Pomodoro : Focus 25′ ↔ Pause 5′ selon tick
      const focusPhase = tick % 6 < 4;
      if (focusPhase) {
        const left = Math.max(60, 25 * 60 - (tick % 4) * 90);
        return {
          state: {
            title: "Focus · deep work",
            subtitle: `Session ${(Math.floor(tick / 6) % 4) + 1}/4 · ${fmtMmSs(left)}`,
            progressBar: { date: now + left * 1000 },
          },
          config,
        };
      }
      const left = Math.max(45, 5 * 60 - (tick % 2) * 40);
      return {
        state: {
          title: "Pause · recharge",
          subtitle: `Respiration · ${fmtMmSs(left)}`,
          progressBar: { date: now + left * 1000 },
        },
        config: { ...config, progressViewTint: "#FF9F0A" },
      };
    }
    case "breathe": {
      // Cycle 4 temps : inspire → hold → expire → hold
      const phases = [
        { title: "Inspire", sub: "4 secondes · nez", secs: 4 },
        { title: "Retiens", sub: "plein · calme", secs: 4 },
        { title: "Expire", sub: "6 secondes · bouche", secs: 6 },
        { title: "Vide", sub: "repos · recommence", secs: 2 },
      ];
      const p = phases[tick % phases.length];
      return {
        state: {
          title: p.title,
          subtitle: `${p.sub} · cycle ${Math.floor(tick / 4) + 1}`,
          progressBar: { date: now + p.secs * 1000 },
        },
        config,
      };
    }
    case "score": {
      const home = 12 + (tick % 9) * 3;
      const away = 10 + ((tick + 3) % 7) * 2;
      const clock = Math.max(15, 12 * 60 - tick * 18);
      const q = (Math.floor(tick / 5) % 4) + 1;
      return {
        state: {
          title: `COR ${home} — ${away} ALT`,
          subtitle: `Q${q} · ${fmtMmSs(clock)} · live`,
          progressBar: { date: now + clock * 1000 },
        },
        config,
      };
    }
    case "timer":
    default: {
      const presets = [
        { title: "Timer Liquid Glass", mins: 5 },
        { title: "Focus 25′", mins: 25 },
        { title: "Sprint final", mins: 3 },
        { title: "Pause courte", mins: 2 },
      ];
      const p = presets[tick % presets.length];
      return {
        state: {
          title: p.title,
          subtitle: "Compte à rebours · Dynamic Island",
          progressBar: { date: now + p.mins * 60_000 },
        },
        config,
      };
    }
  }
}

function fmtMmSs(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
