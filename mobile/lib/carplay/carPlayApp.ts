/**
 * Prototype CarPlay Coraia — plusieurs pages / fonctionnalités.
 *
 * Ce module importe `react-native-carplay`, un module NATIF : il ne doit être
 * chargé QUE lorsque le module natif `RNCarPlay` est présent (build dev-client /
 * TestFlight iOS). L'aiguillage se fait dans `./index.ts` (`setupCarPlay`),
 * jamais en Expo Go ni sur Android/Web.
 *
 * Pages exposées sur l'écran voiture (templates natifs Apple) :
 *  1. Accueil    — ListTemplate → push d'un détail (InformationTemplate)
 *  2. Actions    — GridTemplate (alerte, action-sheet, compteur live, média)
 *  3. Média      — ListTemplate → NowPlayingTemplate
 *  4. Infos      — InformationTemplate mis à jour dynamiquement
 */
import {
  ActionSheetTemplate,
  AlertTemplate,
  CarPlay,
  GridTemplate,
  InformationTemplate,
  ListTemplate,
  NowPlayingTemplate,
  TabBarTemplate,
} from "react-native-carplay";

const IMAGES = {
  icon: require("../../assets/icon.png"),
  island: require("../../assets/liveActivity/island_icon.png"),
  timer: require("../../assets/liveActivity/island_timer.png"),
  cover: require("../../assets/liveActivity/live_cover.png"),
};

type Track = { title: string; artist: string };

const TRACKS: Track[] = [
  { title: "Focus Drive", artist: "Coraia Sound" },
  { title: "Night Highway", artist: "Ernest Naveos" },
  { title: "Studio Session", artist: "COR·ALT" },
];

let counter = 0;
let currentTrack: Track = TRACKS[0];
let screen = { width: 0, height: 0, scale: 0 };

function log(...args: unknown[]): void {
  console.log("[CarPlay]", ...args);
}

function infoItems(): { title: string; detail: string }[] {
  return [
    { title: "État", detail: CarPlay.connected ? "Connecté" : "Déconnecté" },
    {
      title: "Écran voiture",
      detail: `${screen.width}×${screen.height} @${screen.scale}x`,
    },
    { title: "Compteur", detail: String(counter) },
    { title: "Lecture", detail: `${currentTrack.title} · ${currentTrack.artist}` },
    { title: "Build", detail: "Coraia Glass · prototype CarPlay" },
  ];
}

// ---- Templates présentables (alerte / action-sheet), réutilisés ----------
const alertTemplate = new AlertTemplate({
  id: "cp-alert",
  titleVariants: ["Action confirmée", "OK"],
  actions: [{ id: "ok", title: "OK", style: "default" }],
  onActionButtonPressed: () => CarPlay.dismissTemplate(),
});

const actionSheet = new ActionSheetTemplate({
  id: "cp-actionsheet",
  title: "Choisir une action",
  message: "Prototype CarPlay Coraia",
  actions: [
    { id: "nav", title: "Naviguer" },
    { id: "call", title: "Appeler" },
    { id: "cancel", title: "Annuler", style: "cancel" },
  ],
  onActionButtonPressed: ({ id }) => {
    log("action-sheet", id);
    CarPlay.dismissTemplate();
  },
});

// ---- Page « Média » : lecteur natif Now Playing --------------------------
const nowPlaying = new NowPlayingTemplate({
  id: "cp-nowplaying",
  albumArtistButtonEnabled: true,
  upNextButtonEnabled: true,
  upNextButtonTitle: "À suivre",
  buttons: [
    { id: "shuffle", type: "shuffle" },
    { id: "repeat", type: "repeat" },
    { id: "more", type: "more" },
  ],
  onUpNextButtonPressed: () => log("nowplaying: up next"),
  onAlbumArtistButtonPressed: () => log("nowplaying: album/artist"),
  onButtonPressed: ({ id }) => log("nowplaying button", id),
});

// ---- Détail poussé depuis la liste « Accueil » ---------------------------
const detailTemplate = new InformationTemplate({
  id: "cp-detail",
  title: "Détail",
  items: [{ title: "—", detail: "—" }],
  actions: [
    { id: "call", title: "Appeler" },
    { id: "route", title: "Itinéraire" },
    { id: "back", title: "Retour" },
  ],
  onActionButtonPressed: ({ id }) => {
    log("detail action", id);
    if (id === "back") {
      CarPlay.popTemplate();
      return;
    }
    CarPlay.presentTemplate(alertTemplate);
  },
});

const ACCUEIL_ITEMS = [
  { text: "Prochain rendez-vous", detailText: "14:30 · Studio Coraia" },
  { text: "Itinéraire favori", detailText: "12 min · Trafic fluide" },
  { text: "Dernier appel", detailText: "Ernest · il y a 2 h" },
];

const accueil = new ListTemplate({
  id: "cp-accueil",
  title: "Accueil",
  sections: [
    {
      header: "Raccourcis Coraia",
      items: ACCUEIL_ITEMS.map((it) => ({
        text: it.text,
        detailText: it.detailText,
        image: IMAGES.icon,
        showsDisclosureIndicator: true,
      })),
    },
  ],
  onItemSelect: async ({ index }) => {
    const item = ACCUEIL_ITEMS[index] ?? ACCUEIL_ITEMS[0];
    log("accueil select", index, item.text);
    detailTemplate.updateInformationTemplateItems([
      { title: "Élément", detail: item.text },
      { title: "Info", detail: item.detailText },
      { title: "Index", detail: String(index) },
    ]);
    CarPlay.pushTemplate(detailTemplate);
  },
});

// ---- Page « Infos » : mise à jour dynamique ------------------------------
const infoTab = new InformationTemplate({
  id: "cp-infos",
  title: "Infos",
  items: infoItems(),
  actions: [
    { id: "refresh", title: "Rafraîchir" },
    { id: "reset", title: "Réinitialiser le compteur" },
  ],
  onActionButtonPressed: ({ id }) => {
    log("infos action", id);
    if (id === "reset") counter = 0;
    infoTab.updateInformationTemplateItems(infoItems());
  },
});

function refreshInfo(): void {
  infoTab.updateInformationTemplateItems(infoItems());
}

// ---- Page « Média » : liste → Now Playing --------------------------------
const media = new ListTemplate({
  id: "cp-media",
  title: "Média",
  sections: [
    {
      header: "Lecture",
      items: TRACKS.map((t) => ({
        text: t.title,
        detailText: t.artist,
        image: IMAGES.cover,
      })),
    },
  ],
  onItemSelect: async ({ index }) => {
    currentTrack = TRACKS[index] ?? TRACKS[0];
    log("média play", currentTrack.title);
    refreshInfo();
    CarPlay.enableNowPlaying(true);
    CarPlay.pushTemplate(nowPlaying);
  },
});

// ---- Page « Actions » : grille de fonctionnalités ------------------------
const actions = new GridTemplate({
  id: "cp-actions",
  title: "Actions",
  buttons: [
    { id: "alert", titleVariants: ["Alerte"], image: IMAGES.island },
    { id: "sheet", titleVariants: ["Choix"], image: IMAGES.icon },
    { id: "count", titleVariants: ["Compteur +"], image: IMAGES.timer },
    { id: "media", titleVariants: ["Média"], image: IMAGES.cover },
  ],
  onButtonPressed: ({ id }) => {
    log("grid button", id);
    switch (id) {
      case "alert":
        CarPlay.presentTemplate(alertTemplate);
        break;
      case "sheet":
        CarPlay.presentTemplate(actionSheet);
        break;
      case "count":
        counter += 1;
        refreshInfo();
        CarPlay.presentTemplate(alertTemplate);
        break;
      case "media":
        CarPlay.enableNowPlaying(true);
        CarPlay.pushTemplate(nowPlaying);
        break;
      default:
        break;
    }
  },
});

// ---- Racine : barre d'onglets CarPlay ------------------------------------
const root = new TabBarTemplate({
  id: "cp-root",
  templates: [accueil, actions, media, infoTab],
  onTemplateSelect: (_tpl, e) => log("tab select", e.selectedTemplateId),
});

let registered = false;

/** Branche les callbacks connexion et installe la racine sur l'écran voiture. */
export function registerCarPlay(): void {
  if (registered) return;
  registered = true;

  CarPlay.registerOnConnect((win) => {
    screen = win;
    log("connected", win);
    CarPlay.setRootTemplate(root);
    refreshInfo();
  });

  CarPlay.registerOnDisconnect(() => log("disconnected"));

  // Si CarPlay était déjà branché avant le montage du module.
  if (CarPlay.connected) {
    CarPlay.setRootTemplate(root);
    refreshInfo();
  }
}
