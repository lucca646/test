/**
 * Interface CarPlay — catégorie Apple « Driving Task ».
 *
 *   TabBarTemplate
 *   ├── GridTemplate         « Scènes »     8 actions, 1 tap = 1 effet
 *   ├── ListTemplate         « Appareils »  2 sections → InformationTemplate
 *   └── InformationTemplate  « État »       synthèse + 2 actions
 *
 *   par-dessus : ActionSheet (confirmation), Alert (accusé), VoiceControl
 *
 * Ce que le CarPlay Developer Guide impose à cette catégorie, et comment c'est
 * respecté ici :
 *
 *  - Templates autorisés : action sheet, alert, grid, information, list, tab
 *    bar, voice control. `NowPlayingTemplate`, `ContactTemplate`,
 *    `MapTemplate`, `PointOfInterestTemplate` et `SearchTemplate` lèvent une
 *    exception au runtime dans cette catégorie — aucun n'est importé.
 *  - Rafraîchissement des données : jamais plus d'une fois par 10 s. Le tick
 *    ambiant est à 15 s (`src/home.ts`) ; les rendus déclenchés par une action
 *    de l'utilisateur ne comptent pas, mais ils sont regroupés (`schedule`)
 *    pour ne pas écrire dix fois dans le même tour de boucle.
 *  - Profondeur : racine + détail appareil = 2 niveaux. Le maximum toléré est
 *    5, la recommandation 2 à 3.
 *  - Aucun écran de réglages, aucune configuration d'appareil, aucun texte
 *    renvoyant vers l'iPhone : tout ça reste dans l'app téléphone.
 *  - Le nombre de lignes affichables varie d'une voiture à l'autre : on
 *    interroge `getMaximumListItemCount()` à la connexion et on tronque.
 *
 * Contrainte de la bibliothèque : le constructeur de `Template` abonne des
 * écouteurs qu'il ne retire jamais, et `RNCPStore` est un singleton qui n'est
 * pas vidé à la déconnexion. Tous les templates sont donc construits une seule
 * fois, au chargement du module, et réutilisés d'une connexion à l'autre.
 */
import {
  CarPlay,
  GridTemplate,
  InformationTemplate,
  ListTemplate,
  TabBarTemplate,
} from "react-native-carplay";

import {
  SCENES,
  activeCount,
  device,
  devicesIn,
  formatTime,
  getState,
  refresh,
  reportCarPlayError,
  runScene,
  startAmbient,
  subscribe,
  toggleDevice,
  type Device,
} from "../../src/home";
import { acknowledge, confirm, startVoice } from "./overlays";
import { BAR, GRID, LIST } from "./icons";

function log(...args: unknown[]): void {
  console.log("[CarPlay]", ...args);
}

// Abonnement AVANT toute construction de template : le patch natif renvoie ici
// les exceptions levées par CarPlay au lieu de laisser l'app mourir dessus.
// Les instructions d'un module s'exécutent dans l'ordre, l'écouteur est donc
// en place quand les `new …Template(…)` ci-dessous partent.
CarPlay.emitter.addListener(
  "templateError",
  (e: { type: string; templateId: string; name: string; reason: string }) => {
    const text = `${e.type} (${e.templateId}) · ${e.name} · ${e.reason}`;
    log("templateError", text);
    reportCarPlayError(text);
  },
);

/**
 * Plafond de lignes, remplacé par la valeur remontée par la voiture dès la
 * connexion. 12 est la limite basse rencontrée sur les écrans les plus petits.
 */
let maxItems = 12;

// ---------------------------------------------------------------------------
// Onglet « Scènes » — GridTemplate
// ---------------------------------------------------------------------------

/**
 * Les boutons d'une grille sont figés à la construction : le pont natif
 * n'expose aucun `updateGridTemplate`. C'est sans conséquence, une scène ne
 * change pas — l'état vit dans les deux autres onglets.
 */
const scenesGrid = new GridTemplate({
  id: "cp-scenes",
  title: "Scènes",
  tabTitle: "Scènes",
  tabSystemImageName: "square.grid.2x2",
  buttons: SCENES.map((scene) => ({
    id: scene.id,
    titleVariants: scene.titleVariants,
    image: GRID[scene.icon],
  })),
  trailingNavigationBarButtons: [
    { id: "voice", type: "image", image: BAR.mic },
  ],
  onBarButtonPressed: ({ id }) => {
    if (id !== "voice") return;
    // Démo du template de dictée ; voir l'avertissement dans overlays.ts.
    startVoice(() => void applyScene("arrival"));
  },
  onButtonPressed: ({ id }) => {
    void applyScene(id);
  },
});

/** Exécute une scène, en passant par une confirmation quand elle en demande une. */
async function applyScene(id: string): Promise<void> {
  const scene = SCENES.find((s) => s.id === id);
  if (!scene) return;

  const go = async () => {
    log("scène", id);
    await runScene(id);
    acknowledge(id);
  };

  if (scene.confirm) confirm(id, () => void go());
  else await go();
}

// ---------------------------------------------------------------------------
// Onglet « Appareils » — ListTemplate + détail
// ---------------------------------------------------------------------------

const ZONES = [
  { key: "home" as const, header: "Maison", indexTitle: "M" },
  { key: "vehicle" as const, header: "Véhicule", indexTitle: "V" },
];

/**
 * Les index remontés par `didSelectListItem` sont continus d'une section à
 * l'autre. On garde donc l'ordre exact des lignes envoyées à la voiture, sinon
 * un tap se résout contre une liste déjà recalculée.
 */
let rendered: Device[] = [];

function itemFor(d: Device) {
  const state = d.on ? "Actif" : "Coupé";
  return {
    text: d.name,
    detailText: d.reading ? `${state} · ${d.reading}` : `${state} · ${d.place}`,
    image: LIST[d.kind],
    showsDisclosureIndicator: true,
  };
}

function buildSections() {
  const flat: Device[] = [];
  const sections = ZONES.map(({ key, header, indexTitle }) => {
    const items = devicesIn(key).slice(0, Math.max(0, maxItems - flat.length));
    flat.push(...items);
    return { header, sectionIndexTitle: indexTitle, items: items.map(itemFor) };
  }).filter((section) => section.items.length > 0);

  rendered = flat;
  return sections;
}

/** Identifiant de l'appareil dont le détail est empilé, `null` sinon. */
let openDetail: string | null = null;

const devicesList = new ListTemplate({
  id: "cp-devices",
  title: "Appareils",
  tabTitle: "Appareils",
  tabSystemImageName: "list.bullet",
  sections: buildSections(),
  emptyViewTitleVariants: ["Aucun appareil"],
  emptyViewSubtitleVariants: ["La passerelle ne répond pas"],
  // Sans ça la bibliothèque colle un bouton « Back » en dur, en anglais, sur
  // un template racine qui n'a nulle part où revenir.
  backButtonHidden: true,
  leadingNavigationBarButtons: [
    { id: "refresh", type: "image", image: BAR.refresh },
  ],
  onBarButtonPressed: ({ id }) => {
    if (id === "refresh") refresh();
  },
  onItemSelect: async ({ index }) => {
    const d = rendered[index];
    // Deux taps rapides peuvent produire deux évènements avant que
    // l'animation de push ne soit finie ; empiler deux fois le même template
    // est refusé par CarPlay.
    if (!d || openDetail) return;
    log("appareil", d.id);
    openDetail = d.id;
    CarPlay.pushTemplate(detailFor(d.id));
  },
});

/**
 * Un template de détail par appareil, construit à la demande puis conservé :
 * en reconstruire un à chaque ouverture ajouterait des écouteurs à chaque fois.
 */
const details = new Map<string, InformationTemplate>();

function detailItems(d: Device) {
  const items = [
    { title: "État", detail: d.on ? "Actif" : "Coupé" },
    { title: "Emplacement", detail: d.place },
  ];
  if (d.reading) items.push({ title: "Mesure", detail: d.reading });
  return items;
}

function detailActions(d: Device) {
  return [{ id: "toggle", title: d.on ? "Couper" : "Activer" }];
}

function detailFor(id: string): InformationTemplate {
  const cached = details.get(id);
  if (cached) return cached;

  const d = device(id)!;
  const template = new InformationTemplate({
    id: `cp-device-${id}`,
    title: d.name,
    // Mise en page « leading » : deux ou trois lignes en colonne, plus lisible
    // qu'un tableau à deux colonnes pour si peu de contenu.
    leading: true,
    items: detailItems(d),
    actions: detailActions(d),
    onActionButtonPressed: ({ id: actionId }) => {
      if (actionId === "toggle") toggleDevice(id);
    },
    // Le détail recouvre toute la barre d'onglets : il ne disparaît qu'au
    // dépilement, c'est donc le moment exact où la liste redevient tapable.
    onDidDisappear: () => {
      if (openDetail === id) openDetail = null;
    },
  });
  details.set(id, template);
  return template;
}

// ---------------------------------------------------------------------------
// Onglet « État » — InformationTemplate
// ---------------------------------------------------------------------------

function statusItems() {
  const s = getState();
  const alarm = device("alarm");
  const last = s.log[0];
  return [
    { title: "Appareils actifs", detail: `${activeCount()} sur ${s.devices.length}` },
    { title: "Alarme", detail: alarm?.on ? "Armée" : "Désarmée" },
    { title: "Extérieur", detail: `${s.outsideTemp} °C` },
    { title: "Habitacle", detail: `${s.cabinTemp} °C` },
    { title: "Dernière action", detail: last ? last.text : "Aucune" },
    { title: "Synchronisé", detail: formatTime(s.syncedAt) },
  ];
}

const statusInfo = new InformationTemplate({
  id: "cp-status",
  title: "État",
  tabTitle: "État",
  tabSystemImageName: "bolt.horizontal",
  // Deux colonnes : libellé à gauche, valeur à droite, six lignes lisibles
  // d'un coup d'œil.
  leading: false,
  items: statusItems(),
  actions: [
    { id: "refresh", title: "Actualiser" },
    { id: "allOff", title: "Tout couper" },
  ],
  onActionButtonPressed: ({ id }) => {
    if (id === "refresh") refresh();
    if (id === "allOff") void applyScene("allOff");
  },
});

// ---------------------------------------------------------------------------
// Racine
// ---------------------------------------------------------------------------

// L'ordre compte : le pont natif résout les onglets par identifiant dans son
// magasin, ils doivent donc exister avant la barre qui les référence.
const root = new TabBarTemplate({
  id: "cp-root",
  title: "Coraia Drive",
  templates: [scenesGrid, devicesList, statusInfo],
  onTemplateSelect: (_template, e) => {
    log("onglet", e.selectedTemplateId);
  },
});

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------

let pending: ReturnType<typeof setTimeout> | null = null;

/**
 * Une scène touche plusieurs appareils d'un coup : on regroupe les écritures
 * vers la voiture sur un tour de boucle plutôt que d'en envoyer une par
 * changement.
 */
function schedule(): void {
  if (pending) return;
  pending = setTimeout(() => {
    pending = null;
    render();
  }, 0);
}

function render(): void {
  devicesList.updateSections(buildSections());
  statusInfo.updateInformationTemplateItems(statusItems());

  // Seuls les détails déjà ouverts au moins une fois existent ; les autres
  // seront construits à jour.
  details.forEach((template, id) => {
    const d = device(id);
    if (!d) return;
    template.updateInformationTemplateItems(detailItems(d));
    template.updateInformationTemplateActions(detailActions(d));
  });
}

// ---------------------------------------------------------------------------
// Cycle de vie
// ---------------------------------------------------------------------------

let registered = false;

export function registerCarPlay(): void {
  if (registered) return;
  registered = true;

  // L'app iPhone et l'écran voiture pilotent le même état : chaque changement
  // doit se voir des deux côtés, quelle que soit son origine.
  subscribe(schedule);
  startAmbient();

  const attach = () => {
    CarPlay.setRootTemplate(root);
    render();

    // Le nombre de lignes tolérées dépend de la voiture. On le demande une
    // fois branché, puis on retaille la liste si besoin.
    void Promise.resolve(devicesList.getMaximumListItemCount())
      .then((count: number) => {
        if (typeof count === "number" && count > 0 && count !== maxItems) {
          log("lignes max", count);
          maxItems = count;
          schedule();
        }
      })
      .catch(() => {
        /* la voiture ne répond pas : on garde la valeur par défaut */
      });
  };

  CarPlay.registerOnConnect(() => {
    log("connecté");
    attach();
  });

  CarPlay.registerOnDisconnect(() => {
    log("déconnecté");
  });

  if (CarPlay.connected) attach();
}
