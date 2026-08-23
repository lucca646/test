/**
 * Interface CarPlay COR·ALT — catégorie Apple « Communication ».
 *
 * Contraintes du CarPlay Developer Guide (juin 2026) appliquées ici :
 *  - Guidelines §6 — le CONTENU des messages n'est JAMAIS affiché sur l'écran
 *    voiture. Les lignes ne portent que des métadonnées : nom de l'expéditeur,
 *    nombre de non-lus, horodatage. Jamais `last_message`.
 *  - Guidelines §4 — uniquement des flux utiles pendant la conduite. Pas
 *    d'écran de debug, de réglages, de compteur ni de diagnostic.
 *  - Guidelines §2 — aucun texte n'invite à manipuler l'iPhone, même en erreur.
 *  - Guidelines §7 — chaque template sert son usage prévu : une liste pour
 *    choisir, une fiche contact pour agir sur une personne.
 *  - Templates autorisés en catégorie Communication : action sheet, alert,
 *    grid, list, tab bar, contact, information, now playing (iOS 17+), voice
 *    control (iOS 27+). Map / point of interest / search lèveraient une
 *    exception au runtime — ne pas les utiliser ici.
 *  - Profondeur max 5 templates (root inclus) ; on en empile 2.
 *  - Certaines voitures ne montrent que 12 lignes : la liste est plafonnée.
 *
 * `react-native-carplay` est NATIF : ce module n'est chargé que par
 * `./index.ts`, et seulement quand `RNCarPlay` est lié. Jamais en Expo Go.
 */
import { Linking } from "react-native";
import {
  CarPlay,
  ContactTemplate,
  ListTemplate,
  TabBarTemplate,
} from "react-native-carplay";

import { listConversations, type ConversationSummary } from "../../src/messages/api";
import { formatListTimestamp } from "../../src/messages/format";

/** Avatar générique de la fiche contact (150px max côté Apple, cf. Assets). */
const CONTACT_IMAGE = require("../../assets/carplay/contact.png");

/**
 * Plafond de lignes. Apple : « Some cars dynamically limit lists to 12 list
 * items […] you always need to be prepared to handle the case where only 12
 * list items are shown. » On s'aligne sur le pire cas plutôt que d'interroger
 * `getMaximumListItemCount()`, pour un rendu identique dans toutes les voitures.
 */
const MAX_ITEMS = 12;

/** Anti-rafale : une conduite ne justifie pas de marteler l'API. */
const MIN_REFRESH_INTERVAL_MS = 10_000;

function log(...args: unknown[]): void {
  console.log("[CarPlay]", ...args);
}

// ---------------------------------------------------------------------------
// État
// ---------------------------------------------------------------------------

let conversations: ConversationSummary[] = [];
let lastFetchAt = 0;
let fetching = false;
let loadFailed = false;

/**
 * Instantané exact des lignes affichées dans chaque onglet, tronqué comme elles.
 * Un tap ne renvoie qu'un index : le résoudre contre une liste recalculée
 * ouvrirait le mauvais contact si un rafraîchissement s'est glissé entretemps.
 */
let renderedAll: ConversationSummary[] = [];
let renderedUnread: ConversationSummary[] = [];

/** Fiches contact mémoïsées : construire un Template appelle le natif. */
const contactCache = new Map<string, ContactTemplate>();

// ---------------------------------------------------------------------------
// Rendu des lignes — métadonnées uniquement, jamais de texte de message
// ---------------------------------------------------------------------------

function displayName(conv: ConversationSummary): string {
  return conv.name?.trim() || conv.phone || "Inconnu";
}

/**
 * Sous-titre d'une ligne. Volontairement limité au comptage de non-lus et à
 * l'heure : afficher `conv.last_message` violerait Guidelines §6.
 */
function metadataLine(conv: ConversationSummary): string {
  const when = formatListTimestamp(conv.last_date);
  const unread = conv.unread_count ?? 0;
  if (unread > 0) {
    const label = unread > 1 ? `${unread} non lus` : "1 non lu";
    return when ? `${label} · ${when}` : label;
  }
  return when;
}

function toListItems(visible: ConversationSummary[]) {
  return visible.map((conv) => ({
    text: displayName(conv),
    detailText: metadataLine(conv),
    showsDisclosureIndicator: true,
  }));
}

// ---------------------------------------------------------------------------
// Fiche contact — le seul endroit où l'on agit sur une conversation
// ---------------------------------------------------------------------------

function contactFor(conv: ConversationSummary): ContactTemplate {
  const cached = contactCache.get(conv.key);
  if (cached) return cached;

  const phone = conv.phone;
  const template = new ContactTemplate({
    id: `cp-contact-${conv.key}`,
    name: displayName(conv),
    subtitle: phone,
    image: CONTACT_IMAGE,
    actions: [
      { id: "call", type: "call", title: "Appeler" },
      // CPContactMessageButton : déclenche le flux de composition vocale
      // système. C'est la façon prévue par Apple de répondre en conduisant,
      // sans jamais afficher ni saisir de texte à l'écran.
      { id: "message", type: "message", phoneOrEmail: phone, title: "Message" },
    ],
    onButtonPressed: ({ id }) => {
      log("contact action", id, conv.key);
      if (id === "call" && phone) {
        void Linking.openURL(`tel:${phone.replace(/[^\d+]/g, "")}`);
      }
    },
  });

  contactCache.set(conv.key, template);
  return template;
}

// ---------------------------------------------------------------------------
// Onglets
// ---------------------------------------------------------------------------

function unreadConversations(): ConversationSummary[] {
  return conversations.filter((c) => (c.unread_count ?? 0) > 0);
}

/** `rendered` est l'instantané affiché, pas une liste recalculée. */
async function openConversation(rendered: ConversationSummary[], index: number) {
  const conv = rendered[index];
  if (!conv) return;
  log("open", conv.key);
  await CarPlay.pushTemplate(contactFor(conv));
}

const allTab = new ListTemplate({
  id: "cp-messages",
  title: "Messages",
  tabTitle: "Messages",
  tabSystemImageName: "message.fill",
  sections: [{ header: "Conversations", items: [] }],
  emptyViewTitleVariants: ["Aucune conversation"],
  emptyViewSubtitleVariants: ["Rien à afficher pour le moment."],
  // Sans ça, la lib pousse un bouton « Back » en dur, en anglais, sur un
  // onglet racine qui n'a nulle part où revenir.
  backButtonHidden: true,
  onItemSelect: ({ index }) => openConversation(renderedAll, index),
});

const unreadTab = new ListTemplate({
  id: "cp-unread",
  title: "Non lus",
  tabTitle: "Non lus",
  tabSystemImageName: "envelope.badge.fill",
  sections: [{ header: "À traiter", items: [] }],
  emptyViewTitleVariants: ["Tout est lu"],
  emptyViewSubtitleVariants: ["Aucun message en attente."],
  backButtonHidden: true,
  onItemSelect: ({ index }) => openConversation(renderedUnread, index),
});

/**
 * Repeint les deux onglets depuis l'état courant.
 *
 * En cas d'échec réseau, la vue vide reste neutre : Guidelines §2 interdit
 * toute formulation qui demanderait de prendre l'iPhone en main.
 */
function renderTabs(): void {
  renderedAll = conversations.slice(0, MAX_ITEMS);
  renderedUnread = unreadConversations().slice(0, MAX_ITEMS);

  allTab.updateSections([
    {
      header: loadFailed ? "Conversations (hors ligne)" : "Conversations",
      items: toListItems(renderedAll),
    },
  ]);

  unreadTab.updateSections([
    { header: "À traiter", items: toListItems(renderedUnread) },
  ]);
}

// ---------------------------------------------------------------------------
// Données
// ---------------------------------------------------------------------------

async function refresh(force = false): Promise<void> {
  const now = Date.now();
  if (fetching) return;
  if (!force && now - lastFetchAt < MIN_REFRESH_INTERVAL_MS) return;

  fetching = true;
  try {
    conversations = await listConversations();
    loadFailed = false;
    lastFetchAt = Date.now();
    log("conversations", conversations.length);
  } catch (err) {
    loadFailed = true;
    log("chargement impossible", err);
  } finally {
    fetching = false;
    renderTabs();
  }
}

// ---------------------------------------------------------------------------
// Racine
// ---------------------------------------------------------------------------

const root = new TabBarTemplate({
  id: "cp-root",
  templates: [allTab, unreadTab],
  onTemplateSelect: (_tpl, e) => {
    log("tab", e.selectedTemplateId);
    void refresh();
  },
});

let registered = false;

/** Branche les callbacks connexion et installe la racine sur l'écran voiture. */
export function registerCarPlay(): void {
  if (registered) return;
  registered = true;

  CarPlay.registerOnConnect(() => {
    log("connected");
    void CarPlay.setRootTemplate(root);
    void refresh(true);
  });

  // Le cache des fiches contact n'est volontairement JAMAIS vidé : côté natif
  // `RNCPStore` est un singleton dont le dictionnaire de templates survit à la
  // déconnexion, et construire un `ContactTemplate` enregistre un listener JS
  // que la lib ne retire pas. Recréer une fiche déjà connue ferait donc tirer
  // `onButtonPressed` deux fois (double appel `tel:`).
  CarPlay.registerOnDisconnect(() => log("disconnected"));

  if (CarPlay.connected) {
    void CarPlay.setRootTemplate(root);
    void refresh(true);
  }
}
