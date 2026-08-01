import type { IslandMode } from "./liveActivity";

/** Guide FR affiché dans l’app (tap sur l’île ou bouton Comprendre). */
export type IslandGuide = {
  mode: IslandMode;
  title: string;
  tagline: string;
  why: string;
  how: string[];
  tip: string;
  accent: string;
};

export const ISLAND_GUIDES: Record<IslandMode, IslandGuide> = {
  breathe: {
    mode: "breathe",
    title: "Respiration guidée",
    tagline: "L’île te dicte le rythme — suis juste le titre.",
    why: "Tu as ouvert l’activité « Breathe ». Sur la Dynamic Island, le gros mot (Inspire, Retiens, Expire…) est l’ordre du moment. La barre bleue est le temps restant de cette phase.",
    how: [
      "Inspire — air par le nez, ventre souple",
      "Retiens — poumons pleins, épaules basses",
      "Expire — air lent par la bouche, 6 secondes",
      "Vide — petite pause, puis le cycle recommence",
    ],
    tip: "Regarde l’île sans ouvrir l’app : le titre change tout seul grâce à l’autopilot.",
    accent: "#5E5CE6",
  },
  focus: {
    mode: "focus",
    title: "Focus Pomodoro",
    tagline: "Des blocs de travail profond, puis une vraie pause.",
    why: "L’île alterne « Focus » (travail concentré) et « Pause » (récupération). Le compte à rebours indique le temps restant du bloc en cours.",
    how: [
      "Focus — une seule tâche, téléphone face cachée",
      "Pause — lève-toi, hydrate-toi, pas de scroll",
      "4 sessions ≈ un cycle Pomodoro complet",
      "Tape l’île pour revenir ici et changer de mode",
    ],
    tip: "Si tu vois orange sur la barre, c’est la pause — ne culpabilise pas, c’est prévu.",
    accent: "#30D158",
  },
  score: {
    mode: "score",
    title: "Score en direct",
    tagline: "Un match fictif COR·ALT qui tick sur l’île.",
    why: "Démo d’un ticker sportif : le titre montre le score, le sous-titre le quart-temps et l’horloge. Idéal pour comprendre les mises à jour Live Activity.",
    how: [
      "Le score évolue tout seul (autopilot)",
      "Q1 → Q4 = les quarts du match",
      "L’horloge descend comme en vrai",
      "Utile pour prototyper un vrai feed sport plus tard",
    ],
    tip: "Ce n’est pas un vrai match — c’est une démo visuelle de l’île.",
    accent: "#FF453A",
  },
  timer: {
    mode: "timer",
    title: "Minuteur",
    tagline: "Un compte à rebours clair, rien d’autre.",
    why: "Mode classique : titre du timer + temps restant sur l’île (chiffres digitaux). Parfait pour une pause courte ou un sprint.",
    how: [
      "Start lance le minuteur sur l’île et l’écran verrouillé",
      "Tick + ou Autopilot change le scénario (5′, 25′, sprint…)",
      "Stop retire l’activité de l’île",
    ],
    tip: "Long press sur l’île = agrandissement géré par iOS (pas par nous).",
    accent: "#0A84FF",
  },
  music: {
    mode: "music",
    title: "Now Playing",
    tagline: "Simule une lecture audio sur l’île.",
    why: "Le titre = morceau, le sous-titre = artiste / temps restant. Ça imite Apple Music sans lire de vrai son (sandbox).",
    how: [
      "Autopilot fait défiler les titres",
      "Le temps restant diminue à chaque tick",
      "Tap sur l’île → ouvre l’onglet Arcade (démo deep link)",
    ],
    tip: "Sans rebuild on ne peut pas afficher de pochette (images widget cassées).",
    accent: "#BF5AF2",
  },
  progress: {
    mode: "progress",
    title: "Suivi de livraison",
    tagline: "Quatre étapes, de l’entrepôt à ta porte.",
    why: "Chaque mise à jour raconte une étape du colis. Le titre change (scanné → en route → dernier km → arrivé), l’ETA descend.",
    how: [
      "Lis le titre = où en est le colis",
      "Le sous-titre donne le contexte + minutes restantes",
      "Autopilot enchaîne les 4 étapes",
    ],
    tip: "C’est le même pattern qu’Uber Eats / Amazon sur l’île.",
    accent: "#64D2FF",
  },
};

export type IslandBeat = {
  title: string;
  subtitle: string;
  seconds: number;
  tint?: string;
};

/** Phrases FR soignées pour l’île (contrainte widget = 2 lignes texte). */
export function beatsForMode(mode: IslandMode, tick: number): IslandBeat {
  switch (mode) {
    case "breathe": {
      const phases: IslandBeat[] = [
        {
          title: "↑ Inspire",
          subtitle: "Nez · ventre souple · 4 secondes",
          seconds: 4,
          tint: "#64D2FF",
        },
        {
          title: "✦ Retiens",
          subtitle: "Poumons pleins · épaules basses · 4 s",
          seconds: 4,
          tint: "#5E5CE6",
        },
        {
          title: "↓ Expire",
          subtitle: "Bouche · souffle long · 6 secondes",
          seconds: 6,
          tint: "#BF5AF2",
        },
        {
          title: "○ Pause",
          subtitle: "Vide · repose-toi · cycle suivant",
          seconds: 2,
          tint: "#8E8E93",
        },
      ];
      const p = phases[tick % 4];
      const cycle = Math.floor(tick / 4) + 1;
      return {
        ...p,
        subtitle: `${p.subtitle} · cycle ${cycle}`,
      };
    }
    case "focus": {
      const focusPhase = tick % 6 < 4;
      if (focusPhase) {
        const left = Math.max(60, 25 * 60 - (tick % 4) * 90);
        return {
          title: "Focus · une tâche",
          subtitle: `Session ${(Math.floor(tick / 6) % 4) + 1}/4 · encore ${fmt(left)}`,
          seconds: left,
          tint: "#30D158",
        };
      }
      const left = Math.max(45, 5 * 60 - (tick % 2) * 40);
      return {
        title: "Pause · respire",
        subtitle: `Lève-toi · hydrate-toi · ${fmt(left)}`,
        seconds: left,
        tint: "#FF9F0A",
      };
    }
    case "score": {
      const home = 12 + (tick % 9) * 3;
      const away = 10 + ((tick + 3) % 7) * 2;
      const clock = Math.max(15, 12 * 60 - tick * 18);
      const q = (Math.floor(tick / 5) % 4) + 1;
      return {
        title: `COR ${home} — ${away} ALT`,
        subtitle: `Quart-temps ${q} · ${fmt(clock)} restants · démo live`,
        seconds: clock,
        tint: "#FF453A",
      };
    }
    case "music": {
      const tracks = [
        { title: "♪ Liquid Glass", sub: "COR·ALT" },
        { title: "♪ Island Drop", sub: "NativeTabs" },
        { title: "♪ Morph Blue", sub: "128 BPM" },
        { title: "♪ Soft Strong", sub: "Lens Remix" },
      ];
      const t = tracks[tick % tracks.length];
      const left = Math.max(45, 210 - (tick % 8) * 22);
      return {
        title: t.title,
        subtitle: `${t.sub} · −${fmt(left)} restants`,
        seconds: left,
        tint: "#BF5AF2",
      };
    }
    case "progress": {
      const stages: IslandBeat[] = [
        {
          title: "Colis scanné",
          subtitle: "Entrepôt · préparation · ~18 min",
          seconds: 18 * 60,
        },
        {
          title: "En route vers toi",
          subtitle: "Livreur assigné · ~12 min",
          seconds: 12 * 60,
        },
        {
          title: "Dernier kilomètre",
          subtitle: "Presque là · ~4 min",
          seconds: 4 * 60,
        },
        {
          title: "Devant chez toi",
          subtitle: "Sonne · code 4821 · 1 min",
          seconds: 60,
        },
      ];
      return { ...stages[tick % stages.length], tint: "#64D2FF" };
    }
    case "timer":
    default: {
      const presets = [
        { title: "Minuteur · 5 min", seconds: 5 * 60 },
        { title: "Focus long · 25 min", seconds: 25 * 60 },
        { title: "Sprint · 3 min", seconds: 3 * 60 },
        { title: "Micro-pause · 2 min", seconds: 2 * 60 },
      ];
      const p = presets[tick % presets.length];
      return {
        title: p.title,
        subtitle: "Compte à rebours sur l’île · reste concentré",
        seconds: p.seconds,
        tint: "#0A84FF",
      };
    }
  }
}

function fmt(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}
