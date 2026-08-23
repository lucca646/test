/**
 * Interface CarPlay COR·ALT — templates natifs Apple (pas de lecteur audio).
 *
 * `react-native-carplay` est NATIF : chargé uniquement via `./index.ts` quand
 * `RNCarPlay` est lié (dev-client / TestFlight iOS). Jamais en Expo Go.
 *
 * Onglets voiture :
 *  1. Accueil   — raccourcis (RDV, itinéraire, contacts)
 *  2. Messages  — liste de conversations → détail + actions
 *  3. Actions   — grille (alerte, choix, compteur live)
 *  4. Infos     — état connexion / écran / compteur
 */
import {
  ActionSheetTemplate,
  AlertTemplate,
  CarPlay,
  GridTemplate,
  InformationTemplate,
  ListTemplate,
  TabBarTemplate,
} from "react-native-carplay";

const IMAGES = {
  icon: require("../../assets/icon.png"),
  island: require("../../assets/liveActivity/island_icon.png"),
  timer: require("../../assets/liveActivity/island_timer.png"),
};

type Conversation = {
  name: string;
  preview: string;
  when: string;
};

const CONVERSATIONS: Conversation[] = [
  {
    name: "Studio Coraia",
    preview: "OK pour 14:30 demain ?",
    when: "10:12",
  },
  {
    name: "Ernest Naveos",
    preview: "Lien TestFlight envoyé",
    when: "Hier",
  },
  {
    name: "Prospect · Dupont SA",
    preview: "Relance planifiée",
    when: "Lun.",
  },
];

const ACCUEIL_ITEMS = [
  { text: "Prochain rendez-vous", detailText: "14:30 · Studio Coraia" },
  { text: "Itinéraire favori", detailText: "12 min · Trafic fluide" },
  { text: "Dernier appel", detailText: "Ernest · il y a 2 h" },
];

let counter = 0;
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
    { title: "App", detail: "COR·ALT · CarPlay" },
  ];
}

const alertTemplate = new AlertTemplate({
  id: "cp-alert",
  titleVariants: ["Action confirmée", "OK"],
  actions: [{ id: "ok", title: "OK", style: "default" }],
  onActionButtonPressed: () => CarPlay.dismissTemplate(),
});

const actionSheet = new ActionSheetTemplate({
  id: "cp-actionsheet",
  title: "Choisir une action",
  message: "COR·ALT · CarPlay",
  actions: [
    { id: "call", title: "Appeler" },
    { id: "route", title: "Itinéraire" },
    { id: "cancel", title: "Annuler", style: "cancel" },
  ],
  onActionButtonPressed: ({ id }) => {
    log("action-sheet", id);
    CarPlay.dismissTemplate();
  },
});

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

const accueil = new ListTemplate({
  id: "cp-accueil",
  title: "Accueil",
  sections: [
    {
      header: "Raccourcis COR·ALT",
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
    ]);
    CarPlay.pushTemplate(detailTemplate);
  },
});

const messages = new ListTemplate({
  id: "cp-messages",
  title: "Messages",
  sections: [
    {
      header: "Conversations",
      items: CONVERSATIONS.map((c) => ({
        text: c.name,
        detailText: `${c.when} · ${c.preview}`,
        image: IMAGES.icon,
        showsDisclosureIndicator: true,
      })),
    },
  ],
  onItemSelect: async ({ index }) => {
    const conv = CONVERSATIONS[index] ?? CONVERSATIONS[0];
    log("messages select", conv.name);
    detailTemplate.updateInformationTemplateItems([
      { title: "Contact", detail: conv.name },
      { title: "Aperçu", detail: conv.preview },
      { title: "Quand", detail: conv.when },
    ]);
    CarPlay.pushTemplate(detailTemplate);
  },
});

const infoTab = new InformationTemplate({
  id: "cp-infos",
  title: "Infos",
  items: infoItems(),
  actions: [
    { id: "refresh", title: "Rafraîchir" },
    { id: "reset", title: "Réinitialiser" },
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

const actions = new GridTemplate({
  id: "cp-actions",
  title: "Actions",
  buttons: [
    { id: "alert", titleVariants: ["Alerte"], image: IMAGES.island },
    { id: "sheet", titleVariants: ["Choix"], image: IMAGES.icon },
    { id: "count", titleVariants: ["Compteur +"], image: IMAGES.timer },
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
      default:
        break;
    }
  },
});

const root = new TabBarTemplate({
  id: "cp-root",
  templates: [accueil, messages, actions, infoTab],
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

  if (CarPlay.connected) {
    CarPlay.setRootTemplate(root);
    refreshInfo();
  }
}
