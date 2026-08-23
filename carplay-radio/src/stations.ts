/**
 * Catalogue de stations.
 *
 * Flux publics Radio France (Icecast MP3 « midfi », ~128 kbps). Ils servent de
 * jeu de test réel : streaming live, pas de durée connue, reconnexion possible
 * — exactement les conditions qu'un lecteur radio doit gérer.
 *
 * ⚠️ Avant toute publication sur l'App Store, vérifier les droits de diffusion
 * de chaque flux. Écouter un flux public est une chose, le redistribuer dans
 * une app publiée en est une autre.
 */
export type Station = {
  id: string;
  name: string;
  /** Une ligne, affichée sous le nom. Jamais de parole de chanson (Apple). */
  tagline: string;
  url: string;
};

export const STATIONS: Station[] = [
  {
    id: "fip",
    name: "FIP",
    tagline: "Éclectique, sans animation",
    url: "https://icecast.radiofrance.fr/fip-midfi.mp3",
  },
  {
    id: "inter",
    name: "France Inter",
    tagline: "Généraliste",
    url: "https://icecast.radiofrance.fr/franceinter-midfi.mp3",
  },
  {
    id: "info",
    name: "France Info",
    tagline: "Info en continu",
    url: "https://icecast.radiofrance.fr/franceinfo-midfi.mp3",
  },
  {
    id: "culture",
    name: "France Culture",
    tagline: "Savoirs et création",
    url: "https://icecast.radiofrance.fr/franceculture-midfi.mp3",
  },
  {
    id: "musique",
    name: "France Musique",
    tagline: "Classique et jazz",
    url: "https://icecast.radiofrance.fr/francemusique-midfi.mp3",
  },
];

export function stationById(id: string): Station | undefined {
  return STATIONS.find((s) => s.id === id);
}
