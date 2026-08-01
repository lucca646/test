/**
 * Kit modulaire Dynamic Island — tous les layouts prêts.
 * Le widget natif (build) lit `layout` + zones texte.
 */

import type { IslandMode } from "./islandTypes";
import type { LiveActivityConfig, LiveActivityState } from "./liveActivity";

export type IslandLayout =
  | "default"
  | "score"
  | "dual"
  | "timer"
  | "progress"
  | "music"
  | "breathe"
  | "focus"
  | "minimal"
  | "transport"
  | "sides";

/** État enrichi accepté par le module patché. */
export type ModularIslandState = LiveActivityState & {
  layout?: IslandLayout;
  leadingText?: string;
  trailingText?: string;
  leadingLabel?: string;
  trailingLabel?: string;
  centerText?: string;
  bottomText?: string;
  badgeText?: string;
};

export type ModularPayload = {
  state: ModularIslandState;
  config: LiveActivityConfig;
};

const BASE: LiveActivityConfig = {
  backgroundColor: "#0B0B0F",
  titleColor: "#FFFFFF",
  subtitleColor: "#FFFFFFCC",
  progressViewTint: "#0A84FF",
  progressViewLabelColor: "#FFFFFF",
  deepLinkUrl: "/",
  padding: { horizontal: 16, top: 14, bottom: 14 },
};

/** Catalogue : un builder par layout (prêt même si pas branché dans l’UI). */
export const LAYOUT_CATALOG: Record<
  IslandLayout,
  { label: string; description: string }
> = {
  default: {
    label: "Défaut",
    description: "Titre + sous-titre + barre/timer classique",
  },
  score: {
    label: "Score",
    description: "Chiffres gauche / droite de l’île + labels",
  },
  dual: {
    label: "Dual texte",
    description: "Deux textes libres sur les côtés",
  },
  sides: {
    label: "Sides",
    description: "Alias score/dual — leading + trailing",
  },
  timer: {
    label: "Minuteur",
    description: "Compte à rebours digital compact",
  },
  progress: {
    label: "Progress",
    description: "Timer circulaire + étapes",
  },
  music: {
    label: "Musique",
    description: "Titre lecture + temps restant",
  },
  breathe: {
    label: "Respiration",
    description: "Phase centrale (inspire / expire)",
  },
  focus: {
    label: "Focus",
    description: "Session deep work + timer",
  },
  minimal: {
    label: "Minimal",
    description: "Badge / pastille seule",
  },
  transport: {
    label: "Transport",
    description: "Livraison / trajet avec ETA",
  },
};

export function buildScoreState(
  home: number,
  away: number,
  opts?: { quarter?: number; homeLabel?: string; awayLabel?: string },
): ModularPayload {
  const q = opts?.quarter ?? 1;
  return {
    state: {
      title: `${home}|${away}`,
      subtitle: `${opts?.homeLabel ?? "COR"} vs ${opts?.awayLabel ?? "ALT"} · Q${q}`,
      layout: "score",
      leadingText: String(home),
      trailingText: String(away),
      leadingLabel: opts?.homeLabel ?? "COR",
      trailingLabel: opts?.awayLabel ?? "ALT",
      bottomText: `Quart-temps ${q} · live`,
    },
    config: {
      ...BASE,
      backgroundColor: "#1A0A0A",
      progressViewTint: "#FF453A",
    },
  };
}

export function buildDualState(
  left: string,
  right: string,
  opts?: { leftLabel?: string; rightLabel?: string; bottom?: string },
): ModularPayload {
  return {
    state: {
      title: `${left} · ${right}`,
      subtitle: opts?.bottom,
      layout: "dual",
      leadingText: left,
      trailingText: right,
      leadingLabel: opts?.leftLabel,
      trailingLabel: opts?.rightLabel,
      bottomText: opts?.bottom,
    },
    config: BASE,
  };
}

export function buildTimerState(
  title: string,
  endAtMs: number,
  subtitle?: string,
): ModularPayload {
  return {
    state: {
      title,
      subtitle,
      layout: "timer",
      badgeText: "TIM",
      progressBar: { date: endAtMs },
    },
    config: { ...BASE, timerType: "digital" },
  };
}

export function buildBreatheState(phase: string, seconds: number): ModularPayload {
  return {
    state: {
      title: phase,
      subtitle: `${seconds}s · suis le rythme`,
      layout: "breathe",
      centerText: phase,
      badgeText: phase.slice(0, 3).toUpperCase(),
      progressBar: { date: Date.now() + seconds * 1000 },
    },
    config: {
      ...BASE,
      backgroundColor: "#0A1420",
      progressViewTint: "#5E5CE6",
      timerType: "circular",
    },
  };
}

export function buildFocusState(
  title: string,
  endAtMs: number,
  subtitle?: string,
): ModularPayload {
  return {
    state: {
      title,
      subtitle,
      layout: "focus",
      badgeText: "FOC",
      progressBar: { date: endAtMs },
    },
    config: {
      ...BASE,
      backgroundColor: "#0A1A12",
      progressViewTint: "#30D158",
      timerType: "digital",
    },
  };
}

export function buildMusicState(
  track: string,
  artist: string,
  endAtMs: number,
): ModularPayload {
  return {
    state: {
      title: track,
      subtitle: artist,
      layout: "music",
      trailingText: "♪",
      progressBar: { date: endAtMs },
    },
    config: {
      ...BASE,
      backgroundColor: "#12081C",
      progressViewTint: "#BF5AF2",
      timerType: "digital",
      deepLinkUrl: "/arcade",
    },
  };
}

export function buildTransportState(
  title: string,
  subtitle: string,
  endAtMs: number,
): ModularPayload {
  return {
    state: {
      title,
      subtitle,
      layout: "transport",
      badgeText: "GPS",
      bottomText: subtitle,
      progressBar: { date: endAtMs },
    },
    config: {
      ...BASE,
      backgroundColor: "#071018",
      progressViewTint: "#64D2FF",
      timerType: "circular",
    },
  };
}

export function buildMinimalState(badge: string, title: string): ModularPayload {
  return {
    state: {
      title,
      layout: "minimal",
      badgeText: badge,
    },
    config: BASE,
  };
}

/** Mappe nos modes UI → payload modulaire (prêt pour le widget patché). */
export function modularStateForMode(
  mode: IslandMode,
  tick = 0,
): ModularPayload {
  const now = Date.now();
  switch (mode) {
    case "score": {
      const home = 12 + (tick % 9) * 3;
      const away = 10 + ((tick + 3) % 7) * 2;
      return buildScoreState(home, away, { quarter: (Math.floor(tick / 5) % 4) + 1 });
    }
    case "breathe": {
      const phases = [
        { t: "Inspire", s: 4 },
        { t: "Retiens", s: 4 },
        { t: "Expire", s: 6 },
        { t: "Pause", s: 2 },
      ];
      const p = phases[tick % 4];
      return buildBreatheState(p.t, p.s);
    }
    case "focus": {
      const focus = tick % 6 < 4;
      if (focus) {
        return buildFocusState(
          "Focus · une tâche",
          now + Math.max(60, 25 * 60 - (tick % 4) * 90) * 1000,
          `Session ${(Math.floor(tick / 6) % 4) + 1}/4`,
        );
      }
      return buildFocusState(
        "Pause · respire",
        now + Math.max(45, 5 * 60 - (tick % 2) * 40) * 1000,
        "Récupération",
      );
    }
    case "music": {
      const tracks = ["Liquid Glass", "Island Drop", "Morph Blue", "Soft Strong"];
      return buildMusicState(
        tracks[tick % tracks.length],
        "COR·ALT",
        now + Math.max(45, 210 - (tick % 8) * 22) * 1000,
      );
    }
    case "progress": {
      const stages = [
        "Colis scanné",
        "En route vers toi",
        "Dernier kilomètre",
        "Devant chez toi",
      ];
      const mins = [18, 12, 4, 1][tick % 4];
      return buildTransportState(
        stages[tick % 4],
        `ETA · ${mins} min`,
        now + mins * 60_000,
      );
    }
    case "timer":
    default: {
      const mins = [5, 25, 3, 2][tick % 4];
      return buildTimerState(
        `Minuteur · ${mins} min`,
        now + mins * 60_000,
        "Compte à rebours",
      );
    }
  }
}
