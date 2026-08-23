/**
 * Interface CarPlay — catégorie Apple « Audio ».
 *
 * Structure calquée sur l'exemple officiel d'Apple (CarPlay Music) :
 * une liste pour choisir, l'écran Now Playing pour la lecture.
 *
 *   ListTemplate « Radios »  →  NowPlayingTemplate
 *
 * Règles du CarPlay Developer Guide appliquées ici :
 *  - Audio §1 — jamais de paroles de chanson à l'écran. On n'affiche que le
 *    nom de la station et une ligne de description.
 *  - Guidelines §4 — rien qui ne serve pas la conduite : pas de réglages, pas
 *    de diagnostic, pas d'écran de debug.
 *  - Guidelines §2 — aucun texte ne renvoie vers l'iPhone, même en erreur.
 *  - Guidelines §7 — la liste sert à choisir, Now Playing à lire.
 *  - Templates autorisés en catégorie Audio : action sheet (iOS 17+), alert,
 *    grid, list, tab bar, information, now playing, search (iOS 27+), voice
 *    control (iOS 27+). Contact / map / point of interest lèveraient une
 *    exception au runtime.
 *  - Profondeur max 5 templates ; on en empile 2.
 *  - 12 lignes max dans certaines voitures — 5 stations, on est large.
 *
 * L'activation de la session audio est volontairement absente d'ici : elle se
 * fait au premier `playStation()`, cf. le commentaire dans `src/player.ts`.
 */
import { CarPlay, ListTemplate, NowPlayingTemplate } from "react-native-carplay";

import { getState, playStation, subscribe } from "../../src/player";
import { STATIONS } from "../../src/stations";

function log(...args: unknown[]): void {
  console.log("[CarPlay]", ...args);
}

/**
 * `CPNowPlayingTemplate` est un singleton côté natif (`sharedTemplate`) :
 * une seule instance, créée une fois.
 */
const nowPlaying = new NowPlayingTemplate({ id: "cp-nowplaying" });

/** Vrai tant que l'écran Now Playing est au-dessus de la liste. */
let nowPlayingVisible = false;

function stationItems() {
  const { stationId, playing } = getState();
  return STATIONS.map((station) => ({
    text: station.name,
    detailText: station.tagline,
    // Pastille « en cours » native, comme dans Musique.
    isPlaying: playing && station.id === stationId,
    showsDisclosureIndicator: false,
  }));
}

const stationList = new ListTemplate({
  id: "cp-stations",
  title: "Radios",
  sections: [{ header: "Stations", items: stationItems() }],
  emptyViewTitleVariants: ["Aucune station"],
  // Sans ça, la lib injecte un bouton « Back » en dur, en anglais, sur un
  // template racine qui n'a nulle part où revenir.
  backButtonHidden: true,
  onDidAppear: () => {
    nowPlayingVisible = false;
  },
  onItemSelect: async ({ index }) => {
    const station = STATIONS[index];
    if (!station) return;
    log("station", station.id);
    await playStation(station.id);
    if (!nowPlayingVisible) {
      nowPlayingVisible = true;
      await CarPlay.pushTemplate(nowPlaying);
    }
  },
});

/** Repeint la liste quand la lecture change, d'où qu'elle vienne. */
function renderList(): void {
  stationList.updateSections([{ header: "Stations", items: stationItems() }]);
}

let registered = false;

/** Branche les callbacks connexion et installe la racine sur l'écran voiture. */
export function registerCarPlay(): void {
  if (registered) return;
  registered = true;

  // L'UI iPhone et les boutons du volant modifient le même état : la liste
  // doit refléter la lecture quelle que soit son origine.
  subscribe(renderList);

  const attach = () => {
    void CarPlay.setRootTemplate(stationList);
    // Relaie les commandes de l'écran Now Playing (play/pause, piste
    // suivante) vers l'app. Sans ça les boutons de la voiture sont inertes.
    CarPlay.enableNowPlaying(true);
    renderList();
  };

  CarPlay.registerOnConnect(() => {
    log("connected");
    attach();
  });

  CarPlay.registerOnDisconnect(() => {
    log("disconnected");
    nowPlayingVisible = false;
  });

  if (CarPlay.connected) attach();
}
