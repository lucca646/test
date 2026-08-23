/**
 * Lecteur radio — source de vérité unique, partagée par l'UI iPhone et CarPlay.
 *
 * Le code CarPlay tourne hors de React (templates natifs) : l'état ne peut pas
 * vivre dans un hook. On expose donc un singleton observable, et l'UI iPhone
 * s'y abonne via `useSyncExternalStore`.
 *
 * Règle Apple appliquée ici (CarPlay Developer Guide, « Audio handling ») :
 *
 *   « Only activate your audio session the moment you are ready to play audio.
 *     When you activate your audio session, other audio sources in the car will
 *     stop. […] Don't simply activate your audio session at the time your app
 *     launches. »
 *
 * D'où l'initialisation paresseuse : rien n'est configuré tant que personne
 * n'a demandé à écouter. Couper la radio FM de la voiture au lancement de
 * l'app serait un motif de rejet.
 */
import {
  createAudioPlayer,
  setAudioModeAsync,
  type AudioPlayer,
} from "expo-audio";

import { STATIONS, stationById, type Station } from "./stations";

export type PlayerState = {
  stationId: string | null;
  playing: boolean;
  /** Renseigné quand un flux refuse de démarrer (réseau, station HS). */
  error: string | null;
};

let state: PlayerState = { stationId: null, playing: false, error: null };

const listeners = new Set<() => void>();

function emit(next: Partial<PlayerState>): void {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getState(): PlayerState {
  return state;
}

export function currentStation(): Station | null {
  return state.stationId ? stationById(state.stationId) ?? null : null;
}

// ---------------------------------------------------------------------------
// Session audio — configurée au premier play, jamais au lancement
// ---------------------------------------------------------------------------

let player: AudioPlayer | null = null;
let sessionReady = false;

async function ensureSession(): Promise<void> {
  if (sessionReady) return;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    interruptionMode: "doNotMix",
    // Apple : « While in CarPlay, configure audio sessions without recording
    // features. » Un session d'enregistrement perturbe l'audio de la voiture.
    allowsRecording: false,
  });
  sessionReady = true;
}

/** Métadonnées Now Playing — c'est ce que CarPlay affiche sur son écran. */
function lockScreenMetadata(station: Station) {
  return { title: station.name, artist: station.tagline };
}

// ---------------------------------------------------------------------------
// Commandes
// ---------------------------------------------------------------------------

export async function playStation(stationId: string): Promise<void> {
  const station = stationById(stationId);
  if (!station) return;

  try {
    await ensureSession();

    if (!player) {
      player = createAudioPlayer(station.url);
    } else if (state.stationId !== stationId) {
      player.replace(station.url);
    }

    player.play();
    // Alimente MPNowPlayingInfoCenter, que CPNowPlayingTemplate lit pour
    // remplir l'écran voiture. Sans ça, la fiche Now Playing reste vide.
    player.setActiveForLockScreen(true, lockScreenMetadata(station), {
      // Un flux live n'a pas de position : proposer une avance rapide
      // n'aurait aucun sens et Apple demande des contrôles cohérents.
      showSeekForward: false,
      showSeekBackward: false,
    });

    emit({ stationId, playing: true, error: null });
  } catch (err) {
    emit({ playing: false, error: "Lecture impossible" });
    console.warn("[player] échec lecture", station.id, err);
  }
}

export function pause(): void {
  player?.pause();
  emit({ playing: false });
}

export async function toggle(): Promise<void> {
  if (state.playing) {
    pause();
    return;
  }
  await playStation(state.stationId ?? STATIONS[0].id);
}

/** Station suivante / précédente — utilisé par les boutons du volant. */
export async function skip(direction: 1 | -1): Promise<void> {
  const index = STATIONS.findIndex((s) => s.id === state.stationId);
  const from = index === -1 ? 0 : index;
  const next = (from + direction + STATIONS.length) % STATIONS.length;
  await playStation(STATIONS[next].id);
}
