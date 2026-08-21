/**
 * Audio « CarPlay-ready » sans entitlement.
 *
 * Toute app qui joue de l'audio en arrière-plan et publie ses métadonnées via
 * `setActiveForLockScreen` apparaît sur l'écran **Now Playing** de CarPlay (la
 * même surface système que l'écran verrouillé / Centre de contrôle). Aucune
 * demande d'entitlement CarPlay à Apple n'est nécessaire pour ça.
 *
 * Prérequis (déjà configurés) :
 *  - `UIBackgroundModes: ["audio"]` dans app.json (lecture en arrière-plan iOS) ;
 *  - session audio `playback` via `setAudioModeAsync` (ci-dessous).
 *
 * Les pistes/pochettes ci-dessous sont des exemples libres de droits : à
 * remplacer par le vrai contenu Coraia (URLs de flux + artwork).
 */
import { setAudioModeAsync } from "expo-audio";

export type CarTrack = {
  id: string;
  title: string;
  artist: string;
  albumTitle: string;
  uri: string;
  artworkUrl: string;
};

export const CAR_TRACKS: CarTrack[] = [
  {
    id: "focus",
    title: "Focus Drive",
    artist: "Coraia Sound",
    albumTitle: "COR·ALT Sessions",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
    artworkUrl: "https://picsum.photos/seed/coralt-focus/600",
  },
  {
    id: "night",
    title: "Night Highway",
    artist: "Ernest Naveos",
    albumTitle: "COR·ALT Sessions",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
    artworkUrl: "https://picsum.photos/seed/coralt-night/600",
  },
  {
    id: "studio",
    title: "Studio Session",
    artist: "COR·ALT",
    albumTitle: "COR·ALT Sessions",
    uri: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
    artworkUrl: "https://picsum.photos/seed/coralt-studio/600",
  },
];

let configured = false;

/** Configure la session audio pour lecture en arrière-plan (à appeler 1×). */
export async function configureCarAudio(): Promise<void> {
  if (configured) return;
  configured = true;
  await setAudioModeAsync({
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    // 'doNotMix' est requis pour que les contrôles écran verrouillé / CarPlay
    // se lient bien à notre lecteur.
    interruptionMode: "doNotMix",
  });
}

export function lockScreenMetadata(track: CarTrack) {
  return {
    title: track.title,
    artist: track.artist,
    albumTitle: track.albumTitle,
    artworkUrl: track.artworkUrl,
  };
}
